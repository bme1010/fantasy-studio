function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-4xl font-bold">
            Fantasy Football Rankings
          </h1>

          <p className="mt-1 text-slate-400">
            Redraft Rankings
          </p>
        </div>

        <div className="rounded-lg bg-blue-600 px-4 py-2 font-semibold">
          Version 0.1
        </div>
      </div>
    </header>
  );
}

export default Header;