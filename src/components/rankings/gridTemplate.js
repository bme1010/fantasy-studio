// Rank/Pos/comparison cells are fixed-width (sized to their content —
// a badge, an arrow+number). Player is the ONLY flexible column, so it
// automatically absorbs all leftover space instead of sharing it with
// columns that don't need it. This is what lets full names print.
export const RANKING_GRID =
  "grid-cols-[36px_minmax(0,1fr)_48px_54px_54px_54px] gap-x-2 sm:gap-x-3";