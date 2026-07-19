const BASE_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";

const WORKER_PROXY_URL = "https://summer-resonance-2e49.brendanmearll.workers.dev";

// ESPN's fantasy API doesn't send CORS headers, so direct browser fetches
// get blocked before they even reach ESPN ("Failed to fetch", not a 401/403).
// We try direct first (in case that ever changes), then fall through to your
// own Worker proxy (see espn-proxy-worker.js) — public CORS proxies turned
// out to be unreliable (one times out, one 403s).
const CORS_PROXIES = [
  (url) => `${WORKER_PROXY_URL}?url=${encodeURIComponent(url)}`,
];

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithCorsFallback(url, options = {}) {
  // A completed response (ok or not) means CORS didn't block us — trust it,
  // whatever the status code (401/403/404 are real ESPN answers, not proxy issues).
  try {
    return await fetchWithTimeout(url, options, 6000);
  } catch {
    // Threw = network/CORS failure. Fall through to the proxy below.
  }

  let lastError;
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const res = await fetchWithTimeout(buildProxyUrl(url), {}, 10000);
      if (res.ok) return res;
      lastError = new Error(`Proxy returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.name === "AbortError"
      ? "Request timed out — ESPN or your Worker proxy is slow right now. Try again shortly."
      : `Could not reach ESPN via your Worker proxy. Details: ${lastError?.message || "unknown error"}`
  );
}

/**
 * Normalizes a player name for cross-source matching:
 * lowercases, strips accents/punctuation/suffixes (Jr, III, etc).
 * "A.J. Brown" and "AJ Brown Jr." both become "aj brown".
 */
export function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[.'']/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Cached per season so we don't re-fetch ESPN's full player list every poll
let playerNameCache = null; // { year, map: Map<espnPlayerId, normalizedName> }

async function fetchEspnPlayerNameMap(seasonYear) {
  if (playerNameCache && playerNameCache.year === seasonYear) {
    return playerNameCache.map;
  }

  const url = `${BASE_URL}/${seasonYear}/players?scoringPeriodId=0&view=players_wl`;
  const res = await fetchWithCorsFallback(url, {
    headers: {
      "X-Fantasy-Filter": JSON.stringify({ filterActive: { value: true } }),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load ESPN player list (${res.status})`);
  }

  const data = await res.json();
  const map = new Map();
  (data || []).forEach((p) => {
    if (p?.id && p?.fullName) {
      map.set(p.id, normalizeName(p.fullName));
    }
  });

  playerNameCache = { year: seasonYear, map };
  return map;
}

/**
 * Returns the normalized names of every player drafted so far in the given
 * ESPN league. Two-step fetch: draft picks give us numeric player ids only,
 * so we resolve those against ESPN's full player list to get names.
 *
 * Public leagues work out of the box through the Worker proxy above.
 * Private leagues need ESPN_S2 + SWID secrets set on your Worker (see
 * espn-proxy-worker.js setup comments) — the `auth` param below is left in
 * case you want to override it per-call, but normally isn't needed.
 */
export async function fetchEspnDraftedPlayerNames(leagueId, seasonYear, auth = {}) {
  const headers = {};
  if (auth.espnS2 && auth.swid) {
    headers["Cookie"] = `espn_s2=${auth.espnS2}; SWID=${auth.swid}`;
  }

  const draftUrl = `${BASE_URL}/${seasonYear}/segments/0/leagues/${leagueId}?view=mDraftDetail`;
  const draftRes = await fetchWithCorsFallback(draftUrl, { headers });

  if (!draftRes.ok) {
    if (draftRes.status === 401 || draftRes.status === 403) {
      throw new Error("League is private or inaccessible to ESPN's public API.");
    }
    throw new Error(`ESPN request failed (${draftRes.status}). Check your league ID.`);
  }

  const draftData = await draftRes.json();
  const picks = draftData?.draftDetail?.picks || [];
  const pickedIds = picks
    .filter((pick) => pick.playerId && pick.playerId > 0)
    .map((pick) => pick.playerId);

  if (pickedIds.length === 0) return [];

  const nameMap = await fetchEspnPlayerNameMap(seasonYear);

  return pickedIds.map((id) => nameMap.get(id)).filter(Boolean);
}