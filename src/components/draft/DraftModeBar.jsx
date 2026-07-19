import { useState } from "react";

/**
 * Draft mode controls. Manual checkbox-drafting (on each row) always works —
 * this bar just controls an OPTIONAL auto-sync layered on top: Off / ESPN / Sleeper.
 *
 * Pass it the object returned by useDraftMode() with spread props: <DraftModeBar {...draft} />
 */
export default function DraftModeBar({
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
  draftedCount,
  canUndo,
  undoLast,
  clearAll,
}) {
  const [leagueInput, setLeagueInput] = useState(leagueId);
  const [sleeperInput, setSleeperInput] = useState(sleeperDraftId);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex overflow-hidden rounded-lg border border-zinc-700">
          <button
            onClick={() => setMode("none")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "none" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            Manual only
          </button>
          <button
            onClick={() => setMode("espn")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "espn" ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            + ESPN Sync
          </button>
          <button
            onClick={() => setMode("sleeper")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "sleeper" ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            + Sleeper Sync
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="font-semibold text-zinc-300">{draftedCount} drafted</span>
          <button
            onClick={undoLast}
            disabled={!canUndo}
            className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Undo
          </button>
          <button
            onClick={clearAll}
            disabled={draftedCount === 0}
            className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Reset
          </button>
        </div>
      </div>

      {mode === "none" && (
        <p className="text-xs text-zinc-500">
          Check the box on any player row to mark them drafted — no league hookup needed.
        </p>
      )}

      {mode === "espn" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <input
              type="text"
              placeholder="e.g. 123456"
              value={leagueInput}
              onChange={(e) => setLeagueInput(e.target.value)}
              onBlur={() => setLeagueId(leagueInput)}
              className="w-40 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
            />
            <span className="text-[11px] text-zinc-500">
              League ID — from fantasy.espn.com/football/team?leagueId=<b>123456</b>
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <input
              type="number"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              className="w-24 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:border-red-500 focus:outline-none"
            />
            <span className="text-[11px] text-zinc-500">Season year</span>
          </div>

          <SyncStatus isSyncing={isSyncing} lastSynced={lastSynced} syncError={syncError} />
        </div>
      )}

      {mode === "sleeper" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <input
              type="text"
              placeholder="e.g. 998234719873462784"
              value={sleeperInput}
              onChange={(e) => setSleeperInput(e.target.value)}
              onBlur={() => setSleeperDraftId(sleeperInput)}
              className="w-64 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
            <span className="text-[11px] text-zinc-500">
              Draft ID — from sleeper.com/draft/nfl/<b>998234719873462784</b> (the long number in
              the URL while your draft is open), or from your league's "Draft" tab in the app
            </span>
          </div>

          <SyncStatus isSyncing={isSyncing} lastSynced={lastSynced} syncError={syncError} />
        </div>
      )}
    </div>
  );
}

function SyncStatus({ isSyncing, lastSynced, syncError }) {
  if (isSyncing) return <span className="text-xs text-zinc-500">Syncing…</span>;
  if (syncError) return <span className="text-xs text-red-400">{syncError}</span>;
  if (lastSynced) {
    return (
      <span className="text-xs text-zinc-500">Synced {lastSynced.toLocaleTimeString()}</span>
    );
  }
  return null;
}