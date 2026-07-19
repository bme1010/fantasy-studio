import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaTrophy,
  FaFire,
  FaUser,
  FaTableList,
  FaPenToSquare,
} from "react-icons/fa6";
import { FiArrowLeft } from "react-icons/fi";

import { getRankDifference } from "../../utils/rankings";
import { fetchCareerGameLog } from "../../services/sleeperGameLog";

/* ------------------------------------------------------------------ */
/*  WIRING                                                             */
/*  ------------------------------------------------------------------ */
/*  Same wiring as before - this component needs `rank` passed in       */
/*  explicitly since your board derives it from array position.        */
/*                                                                      */
/*    const { players, selectedPlayerId } = useRankings();             */
/*    const selectedPlayer = players.find(p => p.id === selectedPlayerId); */
/*    const selectedRank = players.findIndex(p => p.id === selectedPlayerId) + 1; */
/*                                                                      */
/*    <PlayerProfile                                                    */
/*      player={selectedPlayer}                                        */
/*      rank={selectedRank}                                            */
/*      onClose={() => setSelectedPlayerId(null)}                      */
/*    />                                                                */
/*                                                                      */
/*  onClose is new: on mobile this is a full-screen overlay now, so it  */
/*  needs a way back to the list. Wire it to clear the selection - see  */
/*  the App.jsx snippet at the bottom of this file.                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  MOBILE LAYOUT FIX                                                  */
/*  ------------------------------------------------------------------ */
/*  Same bug as the sidebar had: this was a static `w-96` panel with no */
/*  way to hide itself on a phone, so the instant a player was selected */
/*  it ate the whole screen and squeezed the rankings list to a sliver. */
/*                                                                      */
/*  Fix, mirroring how Sidebar.jsx handles its drawer:                  */
/*    - No player selected: hidden entirely on mobile (hidden md:flex), */
/*      full desktop placeholder unchanged.                             */
/*    - Player selected: fixed inset-0 full-screen overlay on mobile    */
/*      (md:static md:w-96 md:border-l reverts it to the normal side    */
/*      panel at desktop widths), with a back button in the header row  */
/*      that's hidden at md: and up since desktop doesn't need it.      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  REAL GAME LOGS                                                     */
/*  ------------------------------------------------------------------ */
/*  Game logs come from src/services/sleeperGameLog.js, which hits      */
/*  Sleeper's stats API directly in the browser and returns full-PPR   */
/*  scored, week-by-week stats for every season the player has data    */
/*  for. players.json's `id` field is just a row number - the real     */
/*  Sleeper player id is pulled out of the `headshot` URL.             */
/*                                                                      */
/*  IF FETCHES FAIL WITH A CORS ERROR:                                  */
/*  Sleeper's documented v1 endpoints support CORS, but this stats      */
/*  endpoint is undocumented - if your browser console shows a CORS    */
/*  error, add a dev proxy in vite.config.js:                          */
/*                                                                      */
/*    server: {                                                        */
/*      proxy: {                                                       */
/*        "/sleeper-stats": {                                          */
/*          target: "https://api.sleeper.com",                         */
/*          changeOrigin: true,                                        */
/*          rewrite: (p) => p.replace(/^\/sleeper-stats/, "/stats"),   */
/*        },                                                            */
/*      },                                                              */
/*    },                                                                */
/*                                                                      */
/*  and change STATS_BASE in sleeperGameLog.js to "/sleeper-stats/nfl/player". */
/* ------------------------------------------------------------------ */

const COLUMN_SETS = {
  QB: [
    { key: "cmp", label: "C" },
    { key: "att", label: "ATT" },
    { key: "passYd", label: "YD" },
    { key: "passTd", label: "TD" },
    { key: "int", label: "INT" },
    { key: "rushYd", label: "RUSH" },
  ],
  RB: [
    { key: "att", label: "ATT" },
    { key: "rushYd", label: "YD" },
    { key: "rushTd", label: "TD" },
    { key: "rec", label: "REC" },
    { key: "recYd", label: "RECYD" },
  ],
  WR: [
    { key: "tgt", label: "TGT" },
    { key: "rec", label: "REC" },
    { key: "recYd", label: "YD" },
    { key: "recTd", label: "TD" },
  ],
  TE: [
    { key: "tgt", label: "TGT" },
    { key: "rec", label: "REC" },
    { key: "recYd", label: "YD" },
    { key: "recTd", label: "TD" },
  ],
  K: [
    { key: "fg", label: "FG" },
    { key: "fga", label: "FGA" },
    { key: "xp", label: "XP" },
  ],
  DST: [
    { key: "sacks", label: "SK" },
    { key: "int", label: "INT" },
    { key: "fr", label: "FR" },
    { key: "pa", label: "PA" },
  ],
};

function hashId(value) {
  let h = 0;
  const str = String(value ?? "player");
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function computeStats(gameLog) {
  if (!gameLog?.length) {
    return { ppg: 0, total: 0, best: null, games: 0, consistency: 0, trend: 0 };
  }
  const total = gameLog.reduce((s, g) => s + g.fpts, 0);
  const ppg = total / gameLog.length;
  const best = gameLog.reduce((a, b) => (b.fpts > a.fpts ? b : a));
  const variance = gameLog.reduce((s, g) => s + (g.fpts - ppg) ** 2, 0) / gameLog.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.round(100 - (stdDev / (ppg || 1)) * 100));
  const last3 = gameLog.slice(-3);
  const last3Avg = last3.reduce((s, g) => s + g.fpts, 0) / last3.length;
  return { ppg, total, best, games: gameLog.length, consistency, trend: last3Avg - ppg };
}

const positionColors = {
  QB: "bg-red-500/15 text-red-400 border-red-500/30",
  RB: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  WR: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  TE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  K: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  DST: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const AVATAR_PALETTE = [
  "bg-sky-500", "bg-emerald-500", "bg-red-500", "bg-orange-500",
  "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-teal-500",
];

/* Real headshot when it loads; falls back to a colored initials avatar
   (deterministic per player id) when the image 404s or isn't set.
   Sized small now - it lives in the compact header, not a hero block. */
function PlayerAvatar({ player }) {
  const [imgError, setImgError] = useState(false);
  const initials = (player.name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = AVATAR_PALETTE[hashId(player.id) % AVATAR_PALETTE.length];

  if (!player.headshot || imgError) {
    return (
      <div
        className={clsx(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-800 text-sm font-bold text-white",
          color
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={player.headshot}
      alt={player.name}
      onError={() => setImgError(true)}
      className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-zinc-800 object-cover"
    />
  );
}

function TrendBadge({ value }) {
  if (Math.abs(value) < 0.05) {
    return <span className="font-semibold text-zinc-500">=</span>;
  }
  const up = value > 0;
  return (
    <span className={clsx("flex items-center gap-1 font-semibold", up ? "text-emerald-400" : "text-red-400")}>
      {up ? <FaArrowTrendUp size={12} /> : <FaArrowTrendDown size={12} />}
      {up ? "+" : ""}
      {value.toFixed(1)}
    </span>
  );
}

function SeasonTabs({ seasons, selected, onSelect }) {
  if (seasons.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {seasons.map((s) => (
        <button
          key={s.year}
          onClick={() => onSelect(s.year)}
          className={clsx(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
            s.year === selected
              ? "bg-blue-600 text-white"
              : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200"
          )}
        >
          {s.year}
        </button>
      ))}
    </div>
  );
}

function GameLogTable({ gameLog, position }) {
  const columns = COLUMN_SETS[position] || COLUMN_SETS.WR;
  const [sortKey, setSortKey] = useState("week");
  const [sortDir, setSortDir] = useState("asc");
  const avg = gameLog.reduce((s, g) => s + g.fpts, 0) / gameLog.length;

  const sorted = useMemo(() => {
    const rows = [...gameLog];
    rows.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [gameLog, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function Th({ sortKeyName, children }) {
    const active = sortKey === sortKeyName;
    return (
      <th
        onClick={() => handleSort(sortKeyName)}
        className={clsx(
          "cursor-pointer select-none whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wide",
          active ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"
        )}
      >
        {children}
        {active && <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </th>
    );
  }

  return (
    <div className="max-h-full overflow-auto rounded-lg border border-zinc-800/60">
      <table className="w-full min-w-[380px] border-collapse">
        <thead className="sticky top-0 z-10 bg-zinc-900">
          <tr className="border-b border-zinc-800">
            <Th sortKeyName="week">Wk</Th>
            <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Opp</th>
            <Th sortKeyName="fpts">Pts</Th>
            {columns.map((c) => (
              <Th key={c.key} sortKeyName={c.key}>{c.label}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((g) => {
            const diff = g.fpts - avg;
            const heat =
              diff > avg * 0.35 ? "text-emerald-400" : diff < -avg * 0.35 ? "text-red-400" : "text-zinc-300";
            return (
              <tr key={g.week} className="border-b border-zinc-900 last:border-0">
                <td className="whitespace-nowrap px-2 py-1.5 text-left text-xs text-zinc-500">{g.week}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-left text-xs text-zinc-400">{g.opp ?? "-"}</td>
                <td className={clsx("whitespace-nowrap px-2 py-1.5 text-right text-xs font-bold", heat)}>
                  {g.fpts}
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-2 py-1.5 text-right text-xs text-zinc-300">
                    {g[c.key] ?? "-"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyPulse({ gameLog, avg }) {
  const max = Math.max(...gameLog.map((g) => g.fpts), 1);
  const [hover, setHover] = useState(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Weekly pulse</span>
        {hover !== null && (
          <span className="text-xs text-zinc-400">
            Wk {gameLog[hover].week} vs {gameLog[hover].opp ?? "?"} · {gameLog[hover].fpts} pts
          </span>
        )}
      </div>
      <div className="flex h-10 items-end gap-1">
        {gameLog.map((g, i) => {
          const diff = g.fpts - avg;
          const barColor =
            diff > avg * 0.35 ? "bg-emerald-500" : diff < -avg * 0.35 ? "bg-red-500" : "bg-blue-500";
          return (
            <div
              key={g.week}
              className="flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={clsx("w-full rounded-t-sm transition-opacity", barColor)}
                style={{
                  height: `${Math.max(8, (g.fpts / max) * 100)}%`,
                  opacity: hover === null || hover === i ? 1 : 0.35,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: FaUser },
  { key: "log", label: "Game Log", icon: FaTableList },
  { key: "notes", label: "Notes", icon: FaPenToSquare },
];

export default function PlayerProfile({ player, rank, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [seasons, setSeasons] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!player) return;
    let cancelled = false;

    setActiveTab("overview");
    setStatus("loading");
    setError(null);
    setSeasons([]);
    setSelectedYear(null);

    fetchCareerGameLog(player).then((result) => {
      if (cancelled) return;
      if (result.error && !result.seasons.length) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setSeasons(result.seasons);
      setSelectedYear(result.seasons[0]?.year ?? null);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [player?.id]);

  const activeSeason = seasons.find((s) => s.year === selectedYear);
  const gameLog = activeSeason?.gameLog ?? [];
  const stats = useMemo(() => computeStats(gameLog), [gameLog]);

  if (!player) {
    // Hidden entirely on mobile (nothing to show, and it must not steal
    // screen space from the rankings list) - desktop keeps its normal
    // static placeholder panel.
    return (
      <aside className="hidden h-full w-96 flex-col border-l border-zinc-800 bg-zinc-900/50 md:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 text-7xl">🏈</div>
          <h2 className="text-2xl font-bold text-white">Select a Player</h2>
          <p className="mt-3 max-w-xs text-zinc-400">
            Click on any player in your rankings to view their profile,
            rankings, and notes.
          </p>
        </div>
      </aside>
    );
  }

  const flock = getRankDifference("flock", player.id, rank);
  const sleeper = getRankDifference("sleeper", player.id, rank);
  const espn = getRankDifference("espn", player.id, rank);

  const renderComparison = (comparison) => {
    if (!comparison) return "-";
    if (comparison.direction === "equal") return "=";
    if (comparison.direction === "higher") {
      return <span className="font-semibold text-emerald-400">▲ {comparison.difference}</span>;
    }
    return <span className="font-semibold text-red-400">▼ {comparison.difference}</span>;
  };

  return (
    // Mobile: fixed full-screen overlay (this is what was missing - it's
    // the same fix pattern as the sidebar drawer). Desktop (md: and up):
    // reverts to the normal static side panel, no overlay, no backdrop.
    <aside className="fixed inset-0 z-40 flex h-full w-full flex-col bg-zinc-950 md:static md:z-auto md:w-96 md:flex-shrink-0 md:border-l md:border-zinc-800 md:bg-zinc-900/50">

      {/* Compact header - back button (mobile only), avatar, name, position, rank */}
      <motion.div
        key={player.id}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-shrink-0 items-center gap-3 border-b border-zinc-800 p-4"
      >
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
          aria-label="Back to rankings"
        >
          <FiArrowLeft size={20} />
        </button>

        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold leading-tight text-white">{player.name}</h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className={clsx(
                "rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                positionColors[player.position]
              )}
            >
              {player.position}
            </span>
            <span className="truncate">
              {player.team}{player.bye ? ` · Bye ${player.bye}` : ""}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">Rank</div>
          <div className="text-2xl font-black text-white">{rank ? `#${rank}` : "-"}</div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex flex-shrink-0 border-b border-zinc-800 px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                "relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition",
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon size={11} />
              {t.label}
              {active && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full space-y-4 overflow-y-auto p-4"
            >
              {/* ADP + Expert rankings, side by side compact cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">ADP</div>
                  <div className="mt-1 text-2xl font-bold text-white">{player.adp ?? "-"}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">Best Wk</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {status === "ready" && stats.best ? stats.best.fpts : "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">Expert Rankings</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sky-400">Flock</span>
                    {renderComparison(flock)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-violet-400">Sleeper</span>
                    {renderComparison(sleeper)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-400">ESPN</span>
                    {renderComparison(espn)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {selectedYear ? `${selectedYear} Snapshot` : "Season Snapshot"}
                  </span>
                  <span className="text-[10px] text-zinc-600">Full PPR</span>
                </div>

                {status === "loading" && (
                  <div className="py-4 text-center text-xs text-zinc-500">Loading…</div>
                )}
                {status === "error" && (
                  <div className="py-4 text-center text-xs text-zinc-500">{error}</div>
                )}
                {status === "ready" && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-lg bg-zinc-950/60 p-2.5">
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500">PPG</div>
                        <div className="mt-0.5 text-lg font-bold text-white">{stats.ppg.toFixed(1)}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-950/60 p-2.5">
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500">Total Pts</div>
                        <div className="mt-0.5 text-lg font-bold text-white">{stats.total.toFixed(1)}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-950/60 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
                          <FaTrophy size={9} className="text-amber-400" /> Games
                        </div>
                        <div className="mt-0.5 text-lg font-bold text-white">{stats.games}</div>
                      </div>
                      <div className="rounded-lg bg-zinc-950/60 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
                          <FaFire size={9} className="text-red-400" /> Consistency
                        </div>
                        <div className="mt-0.5 text-lg font-bold text-white">{stats.consistency}%</div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-zinc-950/60 p-2.5">
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500">Last 3 vs avg</span>
                      <TrendBadge value={stats.trend} />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "log" && (
            <motion.div
              key="log"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col gap-3 overflow-hidden p-4"
            >
              {status === "loading" && (
                <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
                  Loading real game logs…
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-zinc-500">
                  {error}
                  <span className="mt-1 text-zinc-600">
                    (Likely a rookie with no regular-season games played yet.)
                  </span>
                </div>
              )}

              {status === "ready" && seasons.length > 0 && (
                <>
                  <div className="flex flex-shrink-0 items-center justify-between">
                    <SeasonTabs seasons={seasons} selected={selectedYear} onSelect={setSelectedYear} />
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600">Full PPR</span>
                  </div>

                  <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <WeeklyPulse gameLog={gameLog} avg={stats.ppg} />
                  </div>

                  <div className="min-h-0 flex-1">
                    <GameLogTable gameLog={gameLog} position={player.position} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col p-4"
            >
              <textarea
                placeholder="Write notes about this player..."
                className="
                  h-full
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-zinc-700
                  bg-zinc-950
                  p-3
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-500
                "
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </aside>
  );
}