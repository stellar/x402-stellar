import { useEffect } from "react";
import { Link, Outlet } from "react-router";
import { APP_NAME } from "../constants.ts";

export function Layout() {
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="border-b border-slate-800">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-sky-400 hover:text-sky-300">
            {APP_NAME}
          </Link>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="text-slate-400 hover:text-slate-200">
              Home
            </Link>
            <Link to="/try" className="text-slate-400 hover:text-slate-200">
              Try It
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        Powered by{" "}
        <a
          href="https://www.x402.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-300 underline"
        >
          x402
        </a>{" "}
        on{" "}
        <a
          href="https://stellar.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-300 underline"
        >
          Stellar
        </a>
      </footer>
    </div>
  );
}
