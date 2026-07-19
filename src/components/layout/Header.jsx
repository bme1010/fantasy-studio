import { FaFootballBall } from "react-icons/fa";
import { FiSearch, FiSettings } from "react-icons/fi";
import SaveStatus from "../common/SaveStatus";

export default function Header({
  selectedPosition,
  search,
  setSearch,
  saveStatus,
  resetRankings,
}) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      {/* Top */}
      <div className="flex items-center justify-between px-10 pt-8 pb-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-600 p-3">
            <FaFootballBall className="text-xl text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Earlxo's Fantasy Football Ranking web
            </h1>

            <p className="text-zinc-400">
              {selectedPosition} Rankings
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-10 py-4">
        {/* Search */}
        <div className="relative w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-11 pr-4 outline-none transition focus:border-blue-500"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <SaveStatus status={saveStatus} />

         {/* <div className="text-sm text-zinc-500">
            Version 0.1
          </div>

          <button className="rounded-lg border border-zinc-700 p-2 transition hover:bg-zinc-800">
            <FiSettings size={18} />
          </button> */}

<button
  onClick={resetRankings}
  className="
    rounded-lg
    border
    border-red-500/30
    bg-red-500/10
    px-3
    py-1.5
    text-sm
    font-semibold
    text-red-400

    transition-transform
    duration-200
    ease-out

    hover:scale-150

    hover:bg-red-500
    hover:border-red-500
    hover:text-white
    hover:shadow-lg
    hover:shadow-red-500/30

    active:scale-95
  "
>
  Reset
</button>

        </div>
      </div>
    </header>
  );
}