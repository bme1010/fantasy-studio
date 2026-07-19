// src/services/sleeperGameLog.js
//
// Pulls REAL, week-by-week game logs for a player straight from Sleeper's
// stats API, scored in full PPR. No API key, no server needed.
//
// This is the same endpoint Sleeper's own web/app client uses. It isn't in
// their public v1 docs, but it's read-only, free, and has been stable for
// years. If Sleeper ever changes it, only this file needs to change.
//
//   https://api.sleeper.com/stats/nfl/player/<sleeper_id>
//       ?season=<year>&season_type=regular&grouping=week
//
// -> returns one entry per week the player actually played, each with a
//    `stats` object. Full PPR points live at stats.pts_ppr.
//
// ---------------------------------------------------------------------
// Getting the Sleeper player ID
// ---------------------------------------------------------------------
// Your players.json only stores a sequential row `id` (1, 2, 3...), not
// Sleeper's real player id. But every `headshot` field is a sleepercdn URL
// like:
//   https://sleepercdn.com/content/nfl/players/9221.jpg
// and "9221" IS the real Sleeper player id - so we just pull it out of the
// URL instead of needing a separate name-lookup step.
//
// Players with headshot: null (a handful of deep-bench/rookie entries in
// your file) can't be resolved this way; fetchCareerGameLog() will return
// an empty result with an explanatory `error` string for those.

const STATS_BASE = "https://api.sleeper.com/stats/nfl/player";

export function getSleeperId(player) {
  if (!player?.headshot) return null;
  const match = player.headshot.match(/players\/(\d+)\.(jpg|png)/i);
  return match ? match[1] : null;
}

async function fetchSeasonRaw(sleeperId, season) {
  const url = `${STATS_BASE}/${sleeperId}?season=${season}&season_type=regular&grouping=week`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data) return [];
  // Sleeper sometimes returns an object keyed by week instead of an array -
  // normalize either shape to an array.
  return Array.isArray(data) ? data : Object.values(data);
}

// Maps one raw Sleeper week entry to the exact shape your existing
// GameLogTable / WeeklyPulse / COLUMN_SETS in PlayerProfile.jsx expect.
function mapWeek(raw, position) {
  const s = raw.stats || {};
  const fpts = s.pts_ppr ?? s.pts_half_ppr ?? s.pts_std ?? 0;

  const base = {
    week: raw.week,
    season: Number(raw.season ?? 0),
    opp: raw.opponent || "-",
    // Sleeper's per-player stat blob doesn't reliably include the final
    // score, so W/L is left null when we can't determine it rather than
    // guessing. GameLogTable already renders "-" for falsy values.
    result:
      raw.team_score != null && raw.opponent_score != null
        ? raw.team_score > raw.opponent_score
          ? "W"
          : "L"
        : null,
    fpts: +Number(fpts).toFixed(1),
  };

  switch (position) {
    case "QB":
      return {
        ...base,
        cmp: s.pass_cmp ?? 0,
        att: s.pass_att ?? 0,
        passYd: s.pass_yd ?? 0,
        passTd: s.pass_td ?? 0,
        int: s.pass_int ?? 0,
        rushYd: s.rush_yd ?? 0,
      };
    case "RB":
      return {
        ...base,
        att: s.rush_att ?? 0,
        rushYd: s.rush_yd ?? 0,
        rushTd: s.rush_td ?? 0,
        rec: s.rec ?? 0,
        recYd: s.rec_yd ?? 0,
      };
    case "K":
      return {
        ...base,
        fg: s.fgm ?? 0,
        fga: s.fga ?? 0,
        xp: s.xpm ?? 0,
      };
    case "DST":
      return {
        ...base,
        sacks: s.sack ?? 0,
        int: s.def_int ?? 0,
        fr: s.fum_rec ?? 0,
        pa: s.pts_allow ?? 0,
      };
    case "WR":
    case "TE":
    default:
      return {
        ...base,
        tgt: s.rec_tgt ?? 0,
        rec: s.rec ?? 0,
        recYd: s.rec_yd ?? 0,
        recTd: s.rec_td ?? 0,
      };
  }
}

/**
 * Fetches every season a player has real Sleeper stats for.
 *
 * @param {object} player - a row from players.json (needs .headshot, .position)
 * @param {object} [opts]
 * @param {number} [opts.fromYear] - oldest season to check (default: 7 years back)
 * @param {number} [opts.toYear]   - newest season to check (default: current year)
 * @returns {Promise<{sleeperId: string|null, seasons: {year:number, gameLog:object[]}[], error: string|null}>}
 */
export async function fetchCareerGameLog(player, opts = {}) {
  const sleeperId = getSleeperId(player);
  if (!sleeperId) {
    return {
      sleeperId: null,
      seasons: [],
      error: "No Sleeper ID on file for this player (missing headshot url).",
    };
  }

  const toYear = opts.toYear ?? new Date().getFullYear();
  const fromYear = opts.fromYear ?? toYear - 7;

  const years = [];
  for (let y = toYear; y >= fromYear; y--) years.push(y);

  // One request per season, in parallel. A rookie will just come back
  // with mostly-empty results for their pre-draft years, which get
  // filtered out below.
  const results = await Promise.all(
    years.map(async (year) => {
      try {
        const raw = await fetchSeasonRaw(sleeperId, year);
        const gameLog = raw
          .filter((w) => w && w.stats && Object.keys(w.stats).length > 0)
          .map((w) => mapWeek(w, player.position))
          .sort((a, b) => a.week - b.week);
        return gameLog.length ? { year, gameLog } : null;
      } catch {
        return null;
      }
    })
  );

  const seasons = results.filter(Boolean).sort((a, b) => b.year - a.year);

  return {
    sleeperId,
    seasons,
    error: seasons.length
      ? null
      : "No game log data found yet (rookie with no regular-season games, or Sleeper has nothing on file).",
  };
}