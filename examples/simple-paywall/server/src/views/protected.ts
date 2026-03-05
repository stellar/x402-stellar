export function protectedPageHtml(homeUrl?: string): string {
  const brand = homeUrl
    ? `<a href="${homeUrl}" class="nav-link">
        <span class="nav-brand">Stellar</span>
        <span class="nav-badge">x402</span>
      </a>`
    : `<span class="nav-link">
        <span class="nav-brand">Stellar</span>
        <span class="nav-badge">x402</span>
      </span>`;

  return (
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protected Content - x402 Stellar Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=32&h=32&fm=png" sizes="32x32" />
  <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=96&h=96&fm=png" sizes="96x96" />
  <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=192&h=192&fm=png" sizes="192x192" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
    html {
      line-height: 1.5;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      tab-size: 4;
      -webkit-tap-highlight-color: transparent;
    }
    a { color: inherit; text-decoration: inherit; }
    h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
    img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
    img, video { max-width: 100%; height: auto; }
    body {
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      background: #f8f8f8;
      color: #171717;
      line-height: 24px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      border-bottom: 1px solid #e2e2e2;
      background: #fcfcfc;
    }
    nav {
      width: 100%;
      padding: 8px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #171717;
      line-height: 24px;
    }
    .nav-brand {
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
      letter-spacing: -0.025em;
      color: #171717;
    }
    .nav-badge {
      font-family: Inconsolata;
      font-weight: 700;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: -0.32px;
      border-radius: 9999px;
      padding: 2px 8px;
      background: #fbfaff;
      border: 1px solid #d7cff9;
      color: #5746af;
    }
    .content {
      flex: 1;
      max-width: 960px;
      width: 100%;
      margin: 0 auto;
      padding: 80px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fcfcfc;
      color: #18794e;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      border: 1px solid #e2e2e2;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #30a46c;
    }
    h1 {
      font-size: 40px;
      line-height: 48px;
      font-weight: 600;
      letter-spacing: -1.6px;
      color: #171717;
    }
    .description {
      font-size: 16px;
      line-height: 24px;
      font-weight: 500;
      color: #171717;
      max-width: 600px;
    }
    .tx-link-container {
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      color: #6f6f6f;
    }
    .tx-link-container a {
      color: #5746af;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 16px;
      line-height: 24px;
    }
    .tx-link-container a:hover {
      text-decoration: underline;
    }
    .embed-wrapper {
      background: #fcfcfc;
      border-radius: 8px;
      padding: 24px;
      border: 1px solid #e2e2e2;
      width: 100%;
      max-width: 720px;
    }
    iframe {
      border: none;
      border-radius: 8px;
      width: 100%;
    }
    .attribution {
      font-size: 12px;
      line-height: 16px;
      margin-top: 12px;
      color: #6f6f6f;
    }
    .attribution a {
      color: #6f6f6f;
      text-decoration: none;
    }
    .attribution a:hover {
      text-decoration: underline;
      color: #171717;
    }
    footer {
      width: 100%;
      border-top: 1px solid #e2e2e2;
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      line-height: 20px;
      color: #6f6f6f;
    }
    footer a {
      color: #5746af;
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <nav>
      ${brand}
    </nav>
  </header>

  <div class="content">
    <span class="badge"><span class="badge-dot"></span>Payment Verified</span>
    <h1>Content Unlocked</h1>
    <p class="description">
      Your x402 payment was settled on Stellar. The facilitator verified your signed authorization
      entries and submitted the transaction on-chain. Enjoy this exclusive track below.
    </p>
    <p class="tx-link-container">{{TX_LINK}}</p>
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
  </div>

  <footer>
    Powered by
    <a href="https://www.x402.org/" target="_blank" rel="noopener noreferrer">x402</a>
    on
    <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer">Stellar</a>
    &mdash; learn more in the
    <a href="https://developers.stellar.org/docs/build/apps/x402" target="_blank" rel="noopener noreferrer">Stellar docs</a>.
  </footer>
</body>
</html>`
  );
}
