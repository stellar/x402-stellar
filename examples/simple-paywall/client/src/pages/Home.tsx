import { Link } from "react-router";

const walletLinks = {
  authEntry:
    "https://developers.stellar.org/docs/build/guides/transactions/signing-soroban-invocations",
  freighter: "https://www.freighter.app/",
  albedo: "https://albedo.link/",
  hana: "https://www.hana.money/",
  hot: "https://hot-labs.org/chains/stellar",
  klever: "https://klever.io/crypto-wallet/stellar-xlm/",
  onekey: "https://onekey.so/cryptos/stellar/",
};

const features = [
  {
    title: "Stellar + USDC",
    description:
      "Payments settle in ~5 seconds on Stellar using Soroban token contracts. This demo uses USDC on testnet.",
  },
  {
    title: "HTTPS 402 Protocol",
    description:
      "x402 activates the dormant HTTP 402 status code. Clients pay for resources via request headers -- no accounts, no OAuth, no subscriptions.",
  },
  {
    title: "Micropayments & AI Agents",
    description:
      "Gate any API or page behind a per-request payment. Designed for both human users and autonomous agents.",
  },
];

const resources = [
  {
    label: "Stellar x402 Spec",
    href: "https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_stellar.md",
    description:
      "The exact scheme specification for Stellar, defining the protocol flow and facilitator verification rules.",
  },
  {
    label: "Stellar x402 Docs",
    href: "https://developers.stellar.org/docs/build/apps/x402",
    description: "Official Stellar developer documentation for building x402-enabled apps.",
  },
  {
    label: "@x402/stellar Package",
    href: "https://github.com/coinbase/x402/tree/main/typescript/packages/mechanisms/stellar",
    description:
      "The pull request adding Stellar blockchain support to the x402 protocol (client, facilitator, and server).",
  },
  {
    label: "x402 Protocol",
    href: "https://www.x402.org/",
    description: "The x402 protocol by Coinbase -- HTTP-native payments for the open web.",
  },
];

const compatibleWallets = [
  {
    label: "Freighter (browser extension)",
    href: "https://www.freighter.app/",
  },
  {
    label: "Albedo",
    href: "https://albedo.link/",
  },
  {
    label: "Hana",
    href: "https://www.hana.money/",
  },
  {
    label: "HOT",
    href: "https://hot-labs.org/chains/stellar",
  },
  {
    label: "Klever",
    href: "https://klever.io/crypto-wallet/stellar-xlm/",
  },
  {
    label: "OneKey",
    href: "https://onekey.so/cryptos/stellar/",
  },
];

export function Home() {
  const heroTitle = "x402";

  return (
    <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-20 space-y-20">
      <section className="text-center flex flex-col items-center gap-6">
        <div className="flex items-end gap-2 justify-center">
          <h1 className="text-[64px] leading-[54px] font-semibold tracking-[-1.28px] font-[Inconsolata]">
            {heroTitle}
          </h1>
          <span className="text-base text-[#171717]">on Stellar</span>
        </div>
        <div className="text-[#171717] text-base max-w-[600px]">
          HTTP-native payments on the Stellar network. This demo shows a working paywall powered by
          the{" "}
          <a
            href="https://www.x402.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5746af] font-medium inline-flex items-center gap-1"
          >
            x402 protocol
            <span aria-hidden>↗</span>
          </a>{" "}
          and Soroban smart contracts.
        </div>
        <Link
          to="/try"
          className="bg-[#171717] text-white text-sm font-semibold rounded-lg px-4 py-2 inline-flex items-center gap-2"
        >
          Try the demo
          <span aria-hidden>→</span>
        </Link>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-lg p-6 text-left"
          >
            <h3 className="text-lg font-semibold text-[#171717] mb-2">{f.title}</h3>
            <p className="text-sm text-[#6f6f6f] leading-6">{f.description}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-[-0.96px] text-center">How x402 Works</h2>
        <div className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-lg p-6 w-full max-w-[960px] space-y-4">
          <div className="flex items-center gap-2 text-base">
            <span className="w-6 h-6 rounded-full border border-[#e2e2e2] flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <span>Client requests a protected resource from the server.</span>
          </div>
          <div className="flex items-center gap-2 text-base">
            <span className="w-6 h-6 rounded-full border border-[#e2e2e2] flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <span>
              Server responds with{" "}
              <span className="text-[#5746af] font-semibold font-[Inconsolata]">HTTP 402</span> and
              payment requirements (asset, amount, recipient).
            </span>
          </div>
          <div className="flex items-start gap-2 text-base">
            <span className="w-6 h-6 rounded-full border border-[#e2e2e2] flex items-center justify-center text-sm font-semibold mt-1">
              3
            </span>
            <span>
              Client builds a Soroban{" "}
              <span className="text-[#5746af] font-semibold font-[Inconsolata]">transfer()</span>
              call, signs the authorization entries, and sends the transaction in the request
              header.
            </span>
          </div>
          <div className="flex items-start gap-2 text-base">
            <span className="w-6 h-6 rounded-full border border-[#e2e2e2] flex items-center justify-center text-sm font-semibold mt-1">
              4
            </span>
            <span>
              Server forwards the payment to a facilitator, which verifies and settles it on
              Stellar.
            </span>
          </div>
          <div className="flex items-center gap-2 text-base">
            <span className="w-6 h-6 rounded-full border border-[#e2e2e2] flex items-center justify-center text-sm font-semibold">
              5
            </span>
            <span>
              Server returns{" "}
              <span className="text-[#5746af] font-semibold font-[Inconsolata]">200 OK</span> with
              the requested content.
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-[-0.96px] text-center">
          Compatible Wallets
        </h2>
        <div className="text-base text-center">
          x402 on Stellar requires wallets that support{" "}
          <a
            href={walletLinks.authEntry}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5746af] font-medium inline-flex items-center gap-1"
          >
            auth-entry signing
            <span aria-hidden>↗</span>
          </a>{" "}
          (Soroban authorization entry signing).
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {compatibleWallets.map((wallet) => (
            <a
              key={wallet.label}
              href={wallet.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#fcfcfc] border border-[#e2e2e2] text-[#171717] text-sm px-3 py-2 rounded-lg inline-flex items-center gap-2"
            >
              {wallet.label}
              <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-[-0.96px] text-center">Facilitator</h2>
        <div className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-lg p-6 max-w-[960px] text-center text-base">
          The x402 Facilitator Service is now live. Under the hood, the plugin leverages{" "}
          <a
            href="https://www.openzeppelin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5746af] font-medium inline-flex items-center gap-1"
          >
            OpenZeppelin
            <span aria-hidden>↗</span>
          </a>{" "}
          channels to submit transactions onchain via a managed Relayer and Facilitator setup. Check
          out{" "}
          <a
            href="https://developers.stellar.org/docs/build/apps/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5746af] font-medium inline-flex items-center gap-1"
          >
            Stellar Developer docs
            <span aria-hidden>↗</span>
          </a>
          .
        </div>
      </section>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-semibold tracking-[-0.96px] text-center">Resources</h2>
        <div className="grid gap-8 md:grid-cols-2 w-full max-w-[960px]">
          {resources.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-lg p-6 block"
            >
              <h3 className="text-lg font-semibold text-[#5746af] mb-2">{r.label}</h3>
              <p className="text-sm text-[#6f6f6f] leading-6">{r.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
