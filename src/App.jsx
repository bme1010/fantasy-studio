import { useState, useEffect } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import RankingsTable from "./components/RankingsTable";
import playersData from "./data/players";

function App() {
  const [players, setPlayers] = useState(playersData);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const movePlayer = (direction) => {
    if (selectedPlayer === null) return;

    const index = players.findIndex((p) => p.rank === selectedPlayer);

    if (index === -1) return;

    if (direction === "up" && index === 0) return;

    if (direction === "down" && index === players.length - 1) return;

    const newPlayers = [...players];

    const swapIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    [newPlayers[index], newPlayers[swapIndex]] = [
      newPlayers[swapIndex],
      newPlayers[index],
    ];

    newPlayers.forEach((player, i) => {
      player.rank = i + 1;
    });

    setPlayers([...newPlayers]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "w" || e.key === "ArrowUp") {
        e.preventDefault();
        movePlayer("up");
      }

      if (e.key === "s" || e.key === "ArrowDown") {
        e.preventDefault();
        movePlayer("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      <main className="mx-auto max-w-7xl p-8">

        <SearchBar />

        <div className="mt-8">
          <RankingsTable
            players={players}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
          />
        </div>

      </main>
    </div>
  );
}

export default App;