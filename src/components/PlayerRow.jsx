function PlayerRow({ player, selected, onClick }) {
  const positionColors = {
    QB: "bg-red-500",
    RB: "bg-green-500",
    WR: "bg-blue-500",
    TE: "bg-orange-500",
    K: "bg-gray-500",
    DST: "bg-purple-500",
  };

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-t border-slate-700 transition-all duration-200 ${
        selected
          ? "bg-blue-900/40"
          : "hover:bg-slate-700"
      }`}
    >
      <td className="px-4 py-3 font-bold">{player.rank}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">

          <img
            src={player.image}
            alt={player.name}
            className="h-12 w-12 rounded-full border border-slate-600"
          />

          <span className="font-semibold">
            {player.name}
          </span>

        </div>
      </td>

      <td className="px-4 py-3">{player.team}</td>

      <td className="px-4 py-3">
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold text-white ${positionColors[player.position]}`}
        >
          {player.position}
        </span>
      </td>

      <td className="px-4 py-3">{player.bye}</td>

      <td className="px-4 py-3">{player.age}</td>

      <td className="px-4 py-3">{player.ppg}</td>

      <td className="px-4 py-3">{player.fantasyPoints}</td>
    </tr>
  );
}

export default PlayerRow;