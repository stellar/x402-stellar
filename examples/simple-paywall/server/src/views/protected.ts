export function protectedPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protected Content - x402 Stellar Demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 720px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #38bdf8;
    }
    .badge {
      display: inline-block;
      background: #166534;
      color: #bbf7d0;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
    .embed-wrapper {
      background: #1e293b;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    iframe {
      border: none;
      border-radius: 8px;
      width: 100%;
    }
    .attribution {
      font-size: 0.75rem;
      margin-top: 0.75rem;
    }
    .attribution a {
      color: #cccccc;
      text-decoration: none;
    }
    .attribution a:hover { text-decoration: underline; }
    .footer { font-size: 0.875rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Payment Verified</span>
    <h1>Content Unlocked</h1>
    <p>
      Your x402 payment was settled on Stellar. The facilitator verified your signed authorization
      entries and submitted the transaction on-chain. Enjoy this exclusive track below.
    </p>
    <p>{{TX_LINK}}</p>
    <div class="embed-wrapper">
      <iframe
        width="100%"
        height="300"
        scrolling="no"
        frameborder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2044190296&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
      ></iframe>
      <div class="attribution">
        <a href="https://soundcloud.com/dan-kim-675678711" title="danXkim" target="_blank" rel="noopener noreferrer">danXkim</a> · <a href="https://soundcloud.com/dan-kim-675678711/x402" title="x402 (DJ Reppel Remix)" target="_blank" rel="noopener noreferrer">x402 (DJ Reppel Remix)</a>
      </div>
    </div>
    <p class="footer">
      Powered by <a href="https://www.x402.org/" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:none;">x402</a>
      on <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:none;">Stellar</a>
      &mdash; learn more in the
      <a href="https://developers.stellar.org/docs/build/apps/x402" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:none;">Stellar docs</a>.
    </p>
  </div>
</body>
</html>`;
}
