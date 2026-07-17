import PlayerRow from "./PlayerRow";

function RankingsTable({
  players,
  selectedPlayer,
  setSelectedPlayer,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
      <table className="w-full">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Player</th>
            <th className="px-4 py-3 text-left">Team</th>
            <th className="px-4 py-3 text-left">Pos</th>
            <th className="px-4 py-3 text-left">Bye</th>
            <th className="px-4 py-3 text-left">Age</th>
            <th className="px-4 py-3 text-left">PPG</th>
            <th className="px-4 py-3 text-left">FP</th>
          </tr>
        </thead>

        <tbody>
          {players.map((player) => (
            <PlayerRow
              key={player.name}
              player={player}
              selected={selectedPlayer === player.rank}
              onClick={() => setSelectedPlayer(player.rank)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RankingsTable;