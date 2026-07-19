export default function SearchBar({
  search,
  setSearch,
}) {
  return (
    <input
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      placeholder="Search players..."
      className="mb-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
    />
  );
}