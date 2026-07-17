function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Search players..."
      className="
      w-full
      rounded-xl
      border
      border-slate-700
      bg-slate-800
      px-5
      py-4
      text-lg
      outline-none
      transition
      focus:border-blue-500
      "
    />
  );
}

export default SearchBar;