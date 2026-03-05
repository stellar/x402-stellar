import { createRoot } from "react-dom/client";
import type {} from "./window";
import { StellarPaywall } from "./StellarPaywall";
import { validateX402Config } from "./validate";

// Stellar-specific paywall entry point
window.addEventListener("load", () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  const validationError = validateX402Config();
  if (validationError) {
    console.error("x402 config validation failed:", validationError);
    rootElement.innerHTML = `<div style="padding:2rem;font-family:system-ui,sans-serif;color:#b91c1c"><h2>Payment Configuration Error</h2><p>${validationError}</p></div>`;
    return;
  }

  const x402 = window.x402;
  const paymentRequired = x402.paymentRequired;

  const root = createRoot(rootElement);
  root.render(
    <StellarPaywall
      paymentRequired={paymentRequired}
      onSuccessfulResponse={async (response: Response) => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          document.documentElement.innerHTML = await response.text();
        } else {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.location.href = url;
        }
      }}
    />,
  );
});
