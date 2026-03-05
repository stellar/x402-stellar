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
        <nav className="w-full px-[32px] py-[8px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[16px] leading-[24px] font-semibold tracking-tight">Stellar</span>
            <span className="font-[Inconsolata] font-bold text-[16px] leading-[24px] tracking-[-0.32px] rounded-full px-[8px] py-[2px] bg-[#fbfaff] border border-[#d7cff9] text-[#5746af]">
              x402
            </span>
          </Link>
          {!isTryPage && (
            <Link
              to="/try"
              className="bg-[#171717] text-white text-[14px] leading-[20px] font-semibold rounded-[8px] px-[12px] py-[6px]"
            >
              Try the demo
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="w-full border-t border-[#e2e2e2] px-[32px] py-[24px] text-center text-[14px] leading-[20px] text-[#6f6f6f]">
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
