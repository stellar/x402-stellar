import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { APP_NAME } from "../constants.ts";

export function Layout() {
  const location = useLocation();
  const isTryPage = location.pathname.startsWith("/try");

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#171717] flex flex-col">
      <header className="border-b border-[#e2e2e2] bg-[#fcfcfc]">
        <nav className="max-w-[1240px] mx-auto px-6 lg:px-8 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">Stellar</span>
            <span className="text-xs font-semibold uppercase rounded-full px-2 py-0.5 bg-[#fbfaff] border border-[#d7cff9] text-[#5746af]">
              x402
            </span>
          </Link>
          {!isTryPage && (
            <Link
              to="/try"
              className="bg-[#171717] text-white text-sm font-semibold rounded-md px-3 py-1.5"
            >
              Try the demo
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#e2e2e2] py-6 text-center text-sm text-[#6f6f6f]">
        Powered by{" "}
        <a
          href="https://www.x402.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5746af] hover:underline"
        >
          x402
        </a>{" "}
        on{" "}
        <a
          href="https://stellar.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5746af] hover:underline"
        >
          Stellar
        </a>
      </footer>
    </div>
  );
}
