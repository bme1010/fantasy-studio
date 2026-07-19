import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableRankingRow from "./SortableRankingRow";
import { RANKING_GRID } from "./gridTemplate";

export default function RankingList({
  players,
  selectedPlayerId,
  setSelectedPlayerId,
  moveToIndex,
  toggleTierBreak,
  removeTierBreak,
  hasTierBreak,
  onDraftPlayer,
}) {
  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = players.findIndex(
      (p) => p.id === active.id
    );

    const newIndex = players.findIndex(
      (p) => p.id === over.id
    );

    moveToIndex(oldIndex, newIndex);
  }

  let currentTier = 1;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
      {/* Header */}
      <div
        className={`grid ${RANKING_GRID} items-center border-b border-zinc-800 bg-zinc-900 px-3 py-3 pr-4 sm:px-4`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">
          Rank
        </div>

        <div className="pl-[40px] text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:pl-[60px] sm:text-sm">
  Player
</div>

        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">
          Pos
        </div>

        <div className="flex flex-col items-center">
          <span className="hidden text-[10px] uppercase tracking-wider text-zinc-600 sm:block">
            vs
          </span>
          <span className="mt-0 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-400 sm:mt-1 sm:px-2 sm:py-1 sm:text-[11px]">
            Flock
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="hidden text-[10px] uppercase tracking-wider text-zinc-600 sm:block">
            vs
          </span>
          <span className="mt-0 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 sm:mt-1 sm:px-2 sm:py-1 sm:text-[11px]">
            Sleeper
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="hidden text-[10px] uppercase tracking-wider text-zinc-600 sm:block">
            vs
          </span>
          <span className="mt-0 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400 sm:mt-1 sm:px-2 sm:py-1 sm:text-[11px]">
            ESPN
          </span>
        </div>
      </div>

      {/* Scrollable Player List. [scrollbar-gutter:stable] permanently
          reserves the scrollbar's width in the layout calculation, so
          content never gets shoved under it and never gets clipped by
          overflow-x-hidden the way ESPN was before. */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={players.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {players.map((player, index) => {
              if (
                hasTierBreak(player.id) &&
                index !== 0
              ) {
                currentTier++;
              }

              return (
                <SortableRankingRow
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  tier={currentTier}
                  selected={
                    selectedPlayerId === player.id
                  }
                  onClick={() =>
                    setSelectedPlayerId(player.id)
                  }
                  hasTierBreak={hasTierBreak(player.id)}
                  toggleTierBreak={() =>
                    toggleTierBreak(player.id)
                  }
                  removeTierBreak={() =>
                    removeTierBreak(player.id)
                  }
                  onDraftPlayer={
                    onDraftPlayer
                      ? () => onDraftPlayer(player.id)
                      : undefined
                  }
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {players.length === 0 && (
          <div className="py-10 text-center text-zinc-500">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}