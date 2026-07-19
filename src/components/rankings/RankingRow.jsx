import { motion } from "framer-motion";
import clsx from "clsx";
import { FaGripVertical, FaFlag } from "react-icons/fa6";

import TierDivider from "./TierDivider";
import ComparisonCell from "./ComparisonCell";
import { RANKING_GRID } from "./gridTemplate";

const positionColors = {
  QB: "bg-red-500",
  RB: "bg-green-500",
  WR: "bg-blue-500",
  TE: "bg-orange-500",
  K: "bg-gray-500",
  DST: "bg-purple-500",
};

export default function RankingRow({
  player,
  rank,
  tier,
  selected,
  onClick,
  dragHandleProps,
  hasTierBreak,
  toggleTierBreak,
  removeTierBreak,
  onDraftPlayer,
}) {
  return (
    <>
      {hasTierBreak && rank !== 1 && (
        <TierDivider
          tier={tier}
          onRemove={(e) => {
            e.stopPropagation();
            removeTierBreak();
          }}
        />
      )}

      <motion.div
        layout
        transition={{
          layout: { duration: 0.2 },
        }}
        onClick={onClick}
        className={clsx(
          "group grid",
          RANKING_GRID,
          "items-center rounded-lg border px-3 py-2 transition-all sm:px-4 sm:py-3",
          selected
            ? "border-blue-500 bg-blue-950/40"
            : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        )}
      >
        {/* Rank column: drag handle, rank number, flag */}
        <div className="flex flex-col items-center gap-1">
          <button
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-zinc-500 hover:text-white active:cursor-grabbing"
          >
            <FaGripVertical size={15} />
          </button>

          <span className="text-sm font-bold text-zinc-400 sm:text-base">
            #{rank}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTierBreak();
            }}
            title="Mark tier break"
          >
            <FaFlag
              size={12}
              className={
                hasTierBreak
                  ? "text-blue-400"
                  : "text-zinc-600 hover:text-blue-400"
              }
            />
          </button>
        </div>

        {/* Player — headshot, name, subtle team logo, draft checkbox badge */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative shrink-0">
            <img
              src={player.headshot}
              alt={player.name}
              className="h-8 w-8 rounded-full bg-zinc-800 object-cover sm:h-12 sm:w-12"
            />

            {onDraftPlayer && (
              <input
                type="checkbox"
                title="Mark as drafted"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onDraftPlayer();
                }}
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 cursor-pointer rounded border-zinc-600 bg-zinc-900 accent-blue-500"
              />
            )}
          </div>

          <div className="flex min-w-0 items-start gap-1.5">
  <span className="min-w-0 flex-1 text-sm font-semibold leading-tight sm:text-base">
    {player.name}
  </span>

  <img
    src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team?.toLowerCase()}.png`}
    alt={player.team}
    className="mt-0.5 h-4 w-4 shrink-0 opacity-60 sm:h-5 sm:w-5"
    onError={(e) => { e.currentTarget.style.display = "none"; }}
  />
</div>
        </div>

        {/* Position */}
        <div>
          <span
            className={clsx(
              "rounded px-1.5 py-0.5 text-[10px] font-bold text-white sm:px-2 sm:py-1 sm:text-xs",
              positionColors[player.position]
            )}
          >
            {player.position}
          </span>
        </div>

        {/* Flock */}
        <ComparisonCell
          source="flock"
          playerId={player.id}
          currentRank={rank}
        />

        {/* Sleeper */}
        <ComparisonCell
          source="sleeper"
          playerId={player.id}
          currentRank={rank}
        />

        {/* ESPN */}
        <ComparisonCell
          source="espn"
          playerId={player.id}
          currentRank={rank}
        />
      </motion.div>
    </>
  );
}