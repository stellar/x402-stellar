import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { APP_NAME } from "../constants.ts";

export function Layout() {
  const location = useLocation();
  const isTryPage = location.pathname.startsWith("/try");

  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-base text-fg flex flex-col">
      <header className="border-b border-line bg-surface">
        <nav className="w-full px-[32px] py-[8px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <svg width="96" height="24" viewBox="0 0 96 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stellar">
                <path d="M14.0151 0C15.6137 0 17.161 0.314354 18.6248 0.930233C19.4016 1.25742 20.1463 1.67442 20.8397 2.16199L20.692 2.23897L18.7917 3.2077C17.3407 2.39936 15.6908 1.97594 14.0151 1.97594H13.9381C12.6476 1.98877 11.3893 2.24539 10.2016 2.73937C9.01384 3.23978 7.9481 3.95188 7.03645 4.86287C5.17461 6.72975 4.1474 9.2061 4.1474 11.8364C4.1474 12.2662 4.17308 12.6961 4.23086 13.1259L4.25012 13.2606L4.3721 13.1965L28.0174 1.14194V3.36167L24.0562 5.38252L22.1109 6.37049L4.82151 15.1917L4.74447 15.2366L2.95967 16.1411V16.1347L2.87621 16.1732L0 17.6423V15.4226L0.975858 14.9286C1.79121 14.5116 2.27914 13.652 2.20852 12.7346C2.18926 12.433 2.17642 12.1315 2.17642 11.83C2.17642 10.2326 2.49101 8.68003 3.10734 7.21732C3.70441 5.80593 4.55828 4.5421 5.64328 3.45148C6.72828 2.36728 7.99304 1.50762 9.40547 0.910986C10.8628 0.314354 12.4165 0 14.0151 0Z" fill="currentColor"/>
                <path d="M41.795 3.7915C44.6519 3.79792 47.2135 5.06816 47.8299 8.13472H45.6599C45.1142 6.29351 43.3165 5.67763 41.7115 5.67763C40.4853 5.67763 38.3345 6.22294 38.3345 8C38.3345 9.40497 39.4516 10.1043 40.9218 10.4314L42.7644 10.8484C45.1976 11.3745 48.1124 12.2919 48.1124 15.4932C48.1124 18.6047 45.2169 20.247 42.0582 20.247C38.3088 20.247 35.9398 18.2069 35.5225 15.0313H37.7182C38.1355 17.2253 39.6699 18.3609 42.1031 18.3609C44.4465 18.3609 45.8075 17.2446 45.8075 15.6856C45.8075 14.0176 44.3823 13.3184 42.3856 12.8821L40.4146 12.4651C38.2446 11.984 36.049 10.7779 36.049 8.12831C36.049 5.10666 39.2269 3.7915 41.795 3.7915Z" fill="currentColor"/>
                <path d="M53.8391 19.9647C51.5792 19.9647 51.0528 19.4579 51.0528 17.0072V9.77707H49.1909V8.17963H51.0528V5.22213H53.0494V8.17963H55.2836V9.77707H53.0494V16.7634C53.0494 17.9888 53.1393 18.2967 54.2757 18.2967H55.2836V19.9647H53.8391Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M65.2605 16.5517C64.7533 17.7129 63.7903 18.502 62.0376 18.502C60.2849 18.502 58.4873 17.2702 58.391 14.7298H67.469C67.7322 11.0024 65.5622 7.98075 61.967 7.98075C58.7441 7.98075 56.2466 10.3673 56.2466 14.0946C56.2466 17.5782 58.3075 20.2534 62.0376 20.2534C64.9074 20.2534 66.7756 18.5918 67.3213 16.5517H65.2605ZM61.9734 9.69366C64.0792 9.69366 65.3247 11.3553 65.3696 13.0233H58.4231C58.5964 10.656 60.195 9.69366 61.9734 9.69366Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M77.6577 16.8532C77.6513 14.0754 80.7843 13.2606 85.6315 12.7153V12.433C85.6315 10.2839 84.4245 9.56536 82.9543 9.56536C81.3108 9.56536 80.3478 10.4635 80.2579 11.907H78.197C78.396 9.36648 80.6302 7.94226 82.9351 7.94226C86.1772 7.94226 87.6474 9.49479 87.6282 12.8051L87.6089 15.5188C87.5896 17.4884 87.6988 18.8484 87.9171 19.9647H85.9012C85.837 19.5285 85.7728 19.0473 85.7471 18.3416C85.0216 19.5477 83.7954 20.247 81.7152 20.247C79.5003 20.247 77.6577 19.0217 77.6577 16.8532ZM79.8663 16.8148C79.8663 17.931 80.7201 18.6752 82.1454 18.6752C84.0072 18.6752 85.7856 17.822 85.7856 15.0377V14.2935C82.1647 14.6656 79.8663 15.1917 79.8663 16.8148Z" fill="currentColor"/>
                <path d="M92.1222 13.7931C92.1222 11.2077 93.0403 10.1748 94.8829 10.1748C95.1414 10.1748 95.4279 10.2028 95.7424 10.2335C95.8263 10.2417 95.9121 10.2501 96 10.2582V8.13472C95.7817 8.11548 95.6084 8.11548 95.4093 8.11548C93.8749 8.16039 92.668 8.90457 92.0773 10.239V8.17963H90.1256V19.9711H92.1222V13.7931Z" fill="currentColor"/>
                <path d="M27.0479 9.04571L28.0238 8.55172V6.332L5.89367 17.6103L3.94837 18.5982L0 20.6127V22.8324L23.6453 10.8035L23.7673 10.7394L23.7865 10.8741C23.8443 11.3039 23.87 11.7402 23.87 12.17C23.87 14.8003 22.8428 17.2831 20.9809 19.1435C20.0693 20.0545 19.0035 20.7666 17.8158 21.267C16.6281 21.7674 15.3698 22.0241 14.0793 22.0305H14.0087C12.3266 22.0305 10.6702 21.6006 9.21929 20.7923L9.14224 20.8308L7.17769 21.8316C7.87106 22.3192 8.61579 22.7362 9.39905 23.0698C10.8628 23.6856 12.4101 24 14.0087 24C15.6073 24 17.161 23.6856 18.6183 23.0698C20.0243 22.4731 21.2955 21.6199 22.3805 20.5293C23.4655 19.4387 24.3194 18.1748 24.9165 16.7634C25.5328 15.3007 25.8474 13.7482 25.8474 12.1508C25.8474 11.8492 25.841 11.5413 25.8153 11.2398C25.7447 10.3224 26.2326 9.46271 27.0479 9.04571Z" fill="currentColor"/>
                <path d="M69.3629 19.9647V4.08019H71.3596V19.9647H69.3629Z" fill="currentColor"/>
                <path d="M73.8121 4.08019V19.9647H75.8087V4.08019H73.8121Z" fill="currentColor"/>
              </svg>
              <span className="font-semibold text-[14px] leading-[20px] rounded-full px-[8px] py-[2px] bg-brand-fill border border-brand-subtle text-brand">
                x402
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="bg-toggle rounded-full w-[48px] p-[2px] flex items-center relative cursor-pointer"
            >
              <div className="w-[22px] h-[22px] rounded-full bg-white toggle-knob" />
              {/* Sun icon – visible in light mode */}
              <span className="toggle-sun text-icon absolute left-[6px] top-[6px]">
                <svg width="14" height="14" viewBox="0 0 13.1667 13.1667" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6.58333 0.75V1.91667M6.58333 11.25V12.4167M1.91667 6.58333H0.75M3.26657 3.26657L2.44161 2.44161M9.9001 3.26657L10.7251 2.44161M3.26657 9.9025L2.44161 10.7275M9.9001 9.9025L10.7251 10.7275M12.4167 6.58333H11.25M9.5 6.58333C9.5 8.19416 8.19416 9.5 6.58333 9.5C4.9725 9.5 3.66667 8.19416 3.66667 6.58333C3.66667 4.9725 4.9725 3.66667 6.58333 3.66667C8.19416 3.66667 9.5 4.9725 9.5 6.58333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {/* Moon icon – visible in dark mode */}
              <span className="toggle-moon text-icon absolute right-[6px] top-[6px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12.25 7.46A5.25 5.25 0 1 1 6.54 1.75 4.08 4.08 0 0 0 12.25 7.46z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
