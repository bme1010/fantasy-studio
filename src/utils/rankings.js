import flock from "../data/rankings/flock.json";
import sleeper from "../data/rankings/sleeper.json";
import espn from "../data/rankings/espn.json";

const sources = {
  flock,
  sleeper,
  espn,
};

function buildLookup(source) {
  return Object.fromEntries(
    source.map((player) => [player.id, player.rank])
  );
}

const lookups = {
  flock: buildLookup(flock),
  sleeper: buildLookup(sleeper),
  espn: buildLookup(espn),
};

export function getSourceRank(source, playerId) {
  return lookups[source]?.[playerId] ?? null;
}

export function getRankDifference(
  source,
  playerId,
  currentRank
) {
  const sourceRank = getSourceRank(source, playerId);

  if (sourceRank == null) {
    return null;
  }

  const difference = currentRank - sourceRank;

  return {
    sourceRank,
    difference,

    direction:
      difference === 0
        ? "equal"
        : difference < 0
        ? "higher"
        : "lower",
  };
}