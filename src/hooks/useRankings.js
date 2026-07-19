import { useEffect, useState } from "react";
import defaultPlayers from "../data/players.json";
import { movePlayer } from "../utils/movePlayer";

const STORAGE_KEY = "fantasy-rankings";

export default function useRankings() {
  const savedData = (() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  })();

  const [players, setPlayers] = useState(() => {
    if (!savedData) return structuredClone(defaultPlayers);

    if (Array.isArray(savedData)) {
      return savedData;
    }

    return savedData.players ?? structuredClone(defaultPlayers);
  });

  const [tierBreaks, setTierBreaks] = useState(() => {
    if (!savedData || Array.isArray(savedData)) {
      return [];
    }

    return savedData.tierBreaks ?? [];
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState(
    () => players[0]?.id ?? null
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        players,
        tierBreaks,
      })
    );
  }, [players, tierBreaks]);

  const moveToIndex = (oldIndex, newIndex) => {
    setPlayers((prev) => movePlayer(prev, oldIndex, newIndex));
  };

  const moveUp = () => {
    const currentIndex = players.findIndex(
      (player) => player.id === selectedPlayerId
    );

    if (currentIndex > 0) {
      moveToIndex(currentIndex, currentIndex - 1);
    }
  };

  const moveDown = () => {
    const currentIndex = players.findIndex(
      (player) => player.id === selectedPlayerId
    );

    if (currentIndex < players.length - 1) {
      moveToIndex(currentIndex, currentIndex + 1);
    }
  };

  const toggleTierBreak = (playerId) => {
    setTierBreaks((prev) => {
      const exists = prev.some(
        (tier) => tier.playerId === playerId
      );

      if (exists) {
        return prev.filter(
          (tier) => tier.playerId !== playerId
        );
      }

      return [...prev, { playerId }];
    });
  };

  const removeTierBreak = (playerId) => {
    setTierBreaks((prev) =>
      prev.filter(
        (tier) => tier.playerId !== playerId
      )
    );
  };

  const hasTierBreak = (playerId) => {
    return tierBreaks.some(
      (tier) => tier.playerId === playerId
    );
  };

  const resetRankings = () => {
    const confirmed = window.confirm(
      "Reset your rankings to the original board?\n\nThis will remove all custom rankings and tier breaks."
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    setPlayers(structuredClone(defaultPlayers));
    setTierBreaks([]);
    setSelectedPlayerId(defaultPlayers[0]?.id ?? null);
  };

  return {
    players,
    selectedPlayerId,
    setSelectedPlayerId,

    moveUp,
    moveDown,
    moveToIndex,

    tierBreaks,
    toggleTierBreak,
    removeTierBreak,
    hasTierBreak,

    resetRankings,
  };
}