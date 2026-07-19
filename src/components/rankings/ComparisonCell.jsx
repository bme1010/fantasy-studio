import { getRankDifference } from "../../utils/rankings";

export default function ComparisonCell({
  source,
  playerId,
  currentRank,
}) {
  const result = getRankDifference(
    source,
    playerId,
    currentRank
  );

  if (!result) {
    return (
      <div className="text-center text-zinc-600">
        —
      </div>
    );
  }

  const {
    difference,
    direction,
  } = result;

  if (direction === "equal") {
    return (
      <div className="text-center font-semibold text-zinc-500">
        =
      </div>
    );
  }

  return (
    <div
      className={`text-center font-semibold ${
        direction === "higher"
          ? "text-green-400"
          : "text-red-400"
      }`}
    >
      {direction === "higher" ? "▲" : "▼"}
      {Math.abs(difference)}
    </div>
  );
}