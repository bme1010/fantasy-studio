import { useMemo, useState } from "react";

import useRankings from "./hooks/useRankings";
import useKeyboard from "./hooks/useKeyboard";
import useSaveStatus from "./hooks/useSaveStatus";
import { useDraftMode } from "./hooks/useDraftMode";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

import RankingList from "./components/rankings/RankingList";
import PlayerProfile from "./components/profile/PlayerProfile";
import DraftModeBar from "./components/draft/DraftModeBar";

export default function App() {
  const rankings = useRankings();

  const saveStatus = useSaveStatus(rankings.players);

  useKeyboard(rankings.moveUp, rankings.moveDown);

  const draft = useDraftMode(rankings.players);

  // Two views: normal rankings editing, and draft mode (rankings filtered
  // down to available players + the manual/ESPN/Sleeper sync bar).
  const [isDraftMode, setIsDraftMode] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("Overall");

  const basePlayers = isDraftMode ? draft.availablePlayers : rankings.players;

  const filteredPlayers = useMemo(() => {
    return basePlayers.filter((player) => {
      const matchesSearch = player.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesPosition =
        selectedPosition === "Overall" ||
        player.position === selectedPosition;

      return matchesSearch && matchesPosition;
    });
  }, [basePlayers, search, selectedPosition]);

  const selectedPlayer = useMemo(() => {
    return (
      rankings.players.find(
        (player) => player.id === rankings.selectedPlayerId
      ) ?? null
    );
  }, [rankings.players, rankings.selectedPlayerId]);

  const selectedRank = useMemo(() => {
    const index = rankings.players.findIndex(
      (player) => player.id === rankings.selectedPlayerId
    );

    return index === -1 ? null : index + 1;
  }, [rankings.players, rankings.selectedPlayerId]);

  return (
    // h-screen (not min-h-screen) locks the whole app to the viewport
    // height. That's what makes the nested overflow-hidden/overflow-y-auto
    // setup below actually work: only the rankings list scrolls internally,
    // while the sidebar, header, and player profile panel stay fixed in
    // place instead of scrolling away with the page.
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <Sidebar
        players={rankings.players}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        resetRankings={rankings.resetRankings}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          selectedPosition={selectedPosition}
          search={search}
          setSearch={setSearch}
          saveStatus={saveStatus}
          resetRankings={rankings.resetRankings}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Rankings */}
          <main className="flex flex-1 flex-col overflow-hidden p-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-300">
                {isDraftMode ? "Draft Mode" : "My Rankings"}
              </h2>

              <button
                onClick={() => setIsDraftMode((prev) => !prev)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isDraftMode
                    ? "bg-zinc-700 text-white hover:bg-zinc-600"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isDraftMode ? "← Back to Rankings" : "Draft Mode"}
              </button>
            </div>

            {isDraftMode && <DraftModeBar {...draft} />}

            <div className="flex-1 overflow-hidden">
              <RankingList
                players={filteredPlayers}
                selectedPlayerId={rankings.selectedPlayerId}
                setSelectedPlayerId={rankings.setSelectedPlayerId}
                moveToIndex={rankings.moveToIndex}
                toggleTierBreak={rankings.toggleTierBreak}
                removeTierBreak={rankings.removeTierBreak}
                hasTierBreak={rankings.hasTierBreak}
                onDraftPlayer={isDraftMode ? draft.markDrafted : undefined}
              />
            </div>
          </main>

          {/* Player Profile — stays pinned in view now, regardless of how
              far down the rankings list you've scrolled. */}
          <PlayerProfile
            player={selectedPlayer}
            rank={selectedRank}
          />
        </div>
      </div>
    </div>
  );
}