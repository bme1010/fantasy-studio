import {
  FaFootball,
  FaTableList,
} from "react-icons/fa6";

const categories = [
  { label: "Overall", color: "bg-blue-500" },
  { label: "QB", color: "bg-red-500" },
  { label: "RB", color: "bg-green-500" },
  { label: "WR", color: "bg-blue-500" },
  { label: "TE", color: "bg-orange-500" },
  { label: "K", color: "bg-zinc-500" },
  { label: "DST", color: "bg-purple-500" },
];

export default function Sidebar({
  players,
  selectedPosition,
  setSelectedPosition,
  resetRankings,
}) {
  const getCount = (position) => {
    if (position === "Overall") return players.length;

    return players.filter(
      (player) => player.position === position
    ).length;
  };

  return (
    <aside className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 px-7 py-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/20">
            <FaFootball />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Fantasy House
            </h1>

            <p className="text-sm text-zinc-500">
              Your Personal Draft Board
            </p>
          </div>
        </div>
      </div>

      {/* Section */}
      <div className="px-7 pt-7">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
          <FaTableList className="text-[10px]" />
          Boards
        </div>

        <div className="space-y-2">
          {categories.map((category) => {
            const active =
              selectedPosition === category.label;

            return (
              <button
                key={category.label}
                onClick={() =>
                  setSelectedPosition(category.label)
                }
                className={`group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? "bg-zinc-800 text-white ring-1 ring-blue-500/40"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {/* Active Bar */}
                {active && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-r bg-blue-500" />
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${category.color}`}
                  />

                  <span className="font-medium">
                    {category.label}
                  </span>
                </div>

                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-blue-500/15 text-blue-300"
                      : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                  }`}
                >
                  {getCount(category.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}

      {/*
<div className="mt-auto border-t border-zinc-800 px-7 py-6 space-y-4">

  <button
    onClick={resetRankings}
    className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20"
  >
    Reset Rankings
  </button>

  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
    <div className="text-xs uppercase tracking-widest text-zinc-600">
      Version
    </div>

    <div className="mt-1 text-sm font-semibold text-white">
      Fantasy Studio v0.1
    </div>

    <div className="mt-2 text-xs text-zinc-500">
      Personal Rankings
    </div>
  </div> 

</div> */}
    </aside>
  );
      }
