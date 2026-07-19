import { FaFootballBall } from "react-icons/fa";
import { FiSearch, FiSettings, FiMenu } from "react-icons/fi";
import SaveStatus from "../common/SaveStatus";

export default function Header({
  selectedPosition,
  search,
  setSearch,
  saveStatus,
  resetRankings,
  onMenuClick,
}) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      {/* Top */}
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-10 sm:pt-8 sm:pb-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* Mobile menu button — opens the sidebar drawer */}
          <button
            onClick={onMenuClick}
            className="rounded-xl border border-zinc-800 p-2.5 text-zinc-300 transition hover:bg-zinc-900 md:hidden"
          >
            <FiMenu size={20} />
          </button>

          <div className="hidden rounded-xl bg-blue-600 p-3 sm:block">
            <FaFootballBall className="text-xl text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-3xl">
              Earlxo's Fantasy Football Ranking Web
            </h1>

            <p className="hidden text-zinc-400 sm:block">
              {selectedPosition} Rankings
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-4 sm:px-10">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-11 pr-4 outline-none transition focus:border-blue-500"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 sm:gap-6">
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