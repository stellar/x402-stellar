import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { APP_NAME } from "../constants.ts";
import { StellarLogo } from "./icons/StellarLogo.tsx";
import { SunIcon } from "./icons/SunIcon.tsx";
import { MoonIcon } from "./icons/MoonIcon.tsx";

export function Layout() {
  const location = useLocation();
  const isTryPage = location.pathname.startsWith("/try");

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (err) {
      console.error("Failed to persist theme preference:", err);
    }
  }

  return (
    <div className="min-h-screen bg-base text-fg flex flex-col">
      <header className="border-b border-line bg-surface">
        <nav className="w-full px-[32px] h-[48px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <StellarLogo />
              <span className="font-semibold text-[14px] leading-[20px] rounded-full px-[8px] py-[2px] bg-brand-fill border border-brand-subtle text-brand">
                x402
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="bg-toggle rounded-full w-[48px] p-[2px] flex items-center relative cursor-pointer"
            >
              <div className="w-[22px] h-[22px] rounded-full bg-toggle-knob toggle-knob" />
              <span className="toggle-sun text-icon absolute left-[6px] top-[6px]">
                <SunIcon />
              </span>
              <span className="toggle-moon text-icon absolute right-[6px] top-[6px]">
                <MoonIcon />
              </span>
            </button>

            {!isTryPage && (
              <Link
                to="/try"
                className="bg-action text-action-fg text-[14px] leading-[20px] font-semibold rounded-[6px] px-[10px] py-[6px] inline-flex items-center gap-1"
              >
                Try demo
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="w-full border-t border-line px-[32px] py-[24px] text-center text-[14px] leading-[20px] font-medium text-muted">
        Powered by{" "}
        <a
          href="https://www.x402.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          x402
        </a>{" "}
        on{" "}
        <a
          href="https://stellar.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Stellar
        </a>
      </footer>
    </div>
  );
}
