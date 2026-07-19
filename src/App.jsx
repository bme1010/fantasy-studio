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

  // Sidebar.jsx and Header.jsx already support the mobile drawer (isOpen/
  // onClose/onMenuClick props) — this state is what was missing to
  // actually wire it up. Without it, the hamburger button rendered but
  // did nothing, and the sidebar just sat permanently off-screen.
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Each player's rank in the FULL, unfiltered rankings list — computed
  // once here so it stays stable regardless of search/position filtering,
  // players being removed from view in draft mode, or both at once.
  const originalRankById = useMemo(() => {
    const map = new Map();
    rankings.players.forEach((player, index) => {
      map.set(player.id, index + 1);
    });
    return map;
  }, [rankings.players]);

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
    // h-screen locks the app to viewport height; the 100dvh inline style
    // overrides it on browsers that support dvh (iOS/mobile browsers resize
    // the viewport as their address bar shows/hides, which 100vh doesn't
    // account for — unsupported browsers just ignore the invalid value and
    // fall back to the h-screen class, so this is a safe no-downside add).
    //
    // min-h-0 appears at every nested flex level below. This — not
    // anything mobile-specific — is what was causing "rankings fills the
    // whole screen and I have to scroll up to see the header/profile" on
    // DESKTOP too: flex children default to min-height: auto, so they grow
    // to fit ALL their content (all 319 players) instead of respecting
    // overflow-hidden and scrolling internally. min-h-0 overrides that
    // default so the height constraint actually applies, and only the
    // player list itself scrolls.
    <div
      className="flex h-screen min-h-0 bg-zinc-950 text-white"
      style={{ height: "100dvh" }}
    >
      {/* Sidebar — slides in as a drawer on mobile (controlled by
          sidebarOpen), static/always-visible on desktop */}
      <Sidebar
        players={rankings.players}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        resetRankings={rankings.resetRankings}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Header
          selectedPosition={selectedPosition}
          search={search}
          setSearch={setSearch}
          saveStatus={saveStatus}
          resetRankings={rankings.resetRankings}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Rankings */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4 sm:px-10 sm:py-6">
            <div className="mb-2 flex items-center justify-between">
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

            <div className="min-h-0 flex-1 overflow-hidden">
              <RankingList
                players={filteredPlayers}
                selectedPlayerId={rankings.selectedPlayerId}
                setSelectedPlayerId={rankings.setSelectedPlayerId}
                moveToIndex={rankings.moveToIndex}
                toggleTierBreak={rankings.toggleTierBreak}
                removeTierBreak={rankings.removeTierBreak}
                hasTierBreak={rankings.hasTierBreak}
                onDraftPlayer={isDraftMode ? draft.markDrafted : undefined}
                getRank={(player) => originalRankById.get(player.id)}
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