import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchEspnDraftedPlayerNames, normalizeName } from "../services/espnDraftService";
import { fetchSleeperDraftedPlayerIds } from "../services/sleeperDraftService";
import { getSleeperIdFromHeadshot } from "../utils/sleeperId";

const STORAGE_KEY = "draftMode.draftedPlayers";

// Base poll intervals per source. Sleeper hits the API directly (no proxy),
// so it can poll fast. ESPN goes through a public CORS proxy with real rate
// limits, so it stays more conservative.
// Sleeper's public API allows up to 1000 calls/min, so 1s polling is safe
// and stays well under that limit. Going faster than this won't get you
// updates any sooner — Sleeper's own backend takes a few seconds to reflect
// a pick after it happens, independent of how often you ask.
const BASE_POLL_INTERVAL_MS = {
  espn: 8000,
  sleeper: 1000,
};

// If a poll fails (proxy timeout, rate limit, etc), back off exponentially
// instead of hammering a struggling endpoint. Resets to base on next success.
const MAX_POLL_INTERVAL_MS = 30000;
const BACKOFF_MULTIPLIER = 2;

/**
 * Manages "draft mode": tracks which players have been drafted and returns
 * the board filtered down to available players.
 *
 * Manual marking (the checkbox on each row) always works, regardless of
 * `mode`. `mode` controls an ADDITIONAL auto-sync source layered on top:
 * 'none' (manual only), 'espn', or 'sleeper'.
 *
 * @param {Array} players - your full ranked players list (rankings.players from useRankings)
 */
export function useDraftMode(players) {
  const [draftedIds, setDraftedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [history, setHistory] = useState([]); // ordered stack of drafted ids, for undo
  const [mode, setMode] = useState("none"); // 'none' | 'espn' | 'sleeper'
  const [leagueId, setLeagueId] = useState("");
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [sleeperDraftId, setSleeperDraftId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [currentIntervalMs, setCurrentIntervalMs] = useState(null); // for surfacing in UI if you want
  const timeoutRef = useRef(null);
  const failureCountRef = useRef(0);

  // Persist drafted list across refreshes (survives closing the tab mid-draft)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...draftedIds]));
  }, [draftedIds]);

  const markDrafted = useCallback((id) => {
    setDraftedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setHistory((prev) => [...prev, id]);
  }, []);

  const toggleDrafted = useCallback((id) => {
    setDraftedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const undoLast = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setDraftedIds((ids) => {
        const next = new Set(ids);
        next.delete(last);
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  const clearAll = useCallback(() => {
    setDraftedIds(new Set());
    setHistory([]);
  }, []);

  // Lookups for matching sync results back to your internal player ids
  const nameToId = useMemo(() => {
    const map = new Map();
    players.forEach((p) => map.set(normalizeName(p.name), p.id));
    return map;
  }, [players]);

  // Sleeper ids extracted from headshot URLs - null for any player missing
  // a headshot (e.g. Kenneth Gainwell), which is exactly why Sleeper sync
  // needs the fallbacks below rather than relying on this alone.
  const sleeperIdToId = useMemo(() => {
    const map = new Map();
    players.forEach((p) => {
      const sid = getSleeperIdFromHeadshot(p.headshot);
      if (sid) map.set(sid, p.id);
    });
    return map;
  }, [players]);

  // Second fallback tier: last name + NFL team. Catches cases where the
  // exact full-name match misses because Sleeper uses a nickname Sleeper
  // stores that players.json doesn't (e.g. Sleeper's "Kenny Gainwell" vs
  // players.json's "Kenneth Gainwell") - last name + team is far less
  // likely to drift between sources than a first name is.
  const lastNameTeamToId = useMemo(() => {
    const map = new Map();
    players.forEach((p) => {
      const parts = p.name.trim().split(/\s+/);
      const lastName = parts[parts.length - 1];
      if (!lastName || !p.team) return;
      map.set(`${normalizeName(lastName)}|${p.team}`, p.id);
    });
    return map;
  }, [players]);

  // Auto-sync: poll the chosen source and merge picked players into draftedIds.
  // Uses a self-rescheduling timeout (instead of setInterval) so the delay
  // can shrink/grow based on success vs failure — fast during a healthy
  // live draft, slower automatically if the source starts erroring out.
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    failureCountRef.current = 0;

    if (mode === "none") return;
    if (mode === "espn" && !leagueId) return;
    if (mode === "sleeper" && !sleeperDraftId) return;

    let cancelled = false;
    const baseInterval = BASE_POLL_INTERVAL_MS[mode];

    const scheduleNext = (delay) => {
      if (cancelled) return;
      setCurrentIntervalMs(delay);
      timeoutRef.current = setTimeout(sync, delay);
    };

    const sync = async () => {
      if (cancelled) return;
      setIsSyncing(true);
      setSyncError(null);
      try {
        if (mode === "espn") {
          const draftedNames = await fetchEspnDraftedPlayerNames(leagueId, seasonYear);
          setDraftedIds((prev) => {
            const next = new Set(prev);
            draftedNames.forEach((name) => {
              const id = nameToId.get(name);
              if (id != null) next.add(id);
            });
            return next;
          });
        } else if (mode === "sleeper") {
          const draftedPicks = await fetchSleeperDraftedPlayerIds(sleeperDraftId);
          setDraftedIds((prev) => {
            const next = new Set(prev);
            draftedPicks.forEach(({ sleeperId, name, lastName, team }) => {
              // Tier 1: headshot-derived id (works for ~everyone).
              // Tier 2: exact normalized full-name match.
              // Tier 3: last name + team, for nickname mismatches
              // (e.g. Sleeper's "Kenny" vs players.json's "Kenneth").
              const id =
                (sleeperId && sleeperIdToId.get(sleeperId)) ??
                nameToId.get(name) ??
                (lastName && team
                  ? lastNameTeamToId.get(`${normalizeName(lastName)}|${team}`)
                  : undefined);
              if (id != null) next.add(id);
            });
            return next;
          });
        }
        if (cancelled) return;
        setLastSynced(new Date());
        failureCountRef.current = 0; // reset backoff on success
        scheduleNext(baseInterval);
      } catch (err) {
        if (cancelled) return;
        setSyncError(err.message || "Sync failed");
        failureCountRef.current += 1;
        const backedOff = Math.min(
          baseInterval * BACKOFF_MULTIPLIER ** failureCountRef.current,
          MAX_POLL_INTERVAL_MS
        );
        scheduleNext(backedOff);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    sync(); // immediate first sync

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mode, leagueId, seasonYear, sleeperDraftId, nameToId, sleeperIdToId, lastNameTeamToId]);

  const availablePlayers = useMemo(
    () => players.filter((p) => !draftedIds.has(p.id)),
    [players, draftedIds]
  );

  return {
    draftedIds,
    availablePlayers,
    mode,
    setMode,
    leagueId,
    setLeagueId,
    seasonYear,
    setSeasonYear,
    sleeperDraftId,
    setSleeperDraftId,
    isSyncing,
    lastSynced,
    syncError,
    currentIntervalMs,
    markDrafted,
    toggleDrafted,
    undoLast,
    clearAll,
    canUndo: history.length > 0,
    draftedCount: draftedIds.size,
  };
}