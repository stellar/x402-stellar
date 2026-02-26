import { Link } from "react-router";
import { APP_NAME } from "../constants";

const features = [
  {
    title: "Stellar + USDC",
    description:
      "Payments settle in ~5 seconds on Stellar using Soroban token contracts. This demo uses USDC on testnet.",
  },
  {
    title: "HTTP 402 Protocol",
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
    href: "https://github.com/coinbase/x402/pull/711",
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
  "Freighter (browser extension)",
  "Albedo",
  "Hana",
  "HOT",
  "Klever",
  "One Key",
];

export function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      {/* Hero */}
      <section className="text-center mb-20">
        <h1 className="text-5xl font-bold text-white mb-4">{APP_NAME}</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          HTTP-native payments on the Stellar network. This demo shows a working paywall powered by
          the{" "}
          <a
            href="https://www.x402.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline"
          >
            x402 protocol
          </a>{" "}
          and Soroban smart contracts.
        </p>
        <Link
          to="/try"
          className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Try the Demo &rarr;
        </Link>
      </section>

      {/* Feature cards */}
      <section className="grid md:grid-cols-3 gap-8 mb-20">
        {features.map((f) => (
          <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
          </div>
        ))}
      </section>

      {/* How x402 works */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">How x402 Works</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-3xl mx-auto">
          <ol className="space-y-4 text-slate-300 text-sm leading-relaxed list-decimal list-inside">
            <li>Client requests a protected resource from the server.</li>
            <li>
              Server responds with <code className="text-sky-400">HTTP 402</code> and payment
              requirements (asset, amount, recipient).
            </li>
            <li>
              Client builds a Soroban <code className="text-sky-400">transfer()</code> call, signs
              the authorization entries, and sends the transaction in the request header.
            </li>
            <li>
              Server forwards the payment to a facilitator, which verifies and settles it on
              Stellar.
            </li>
            <li>
              Server returns <code className="text-sky-400">200 OK</code> with the requested
              content.
            </li>
          </ol>
        </div>
      </section>

      {/* Compatible wallets */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Compatible Wallets</h2>
        <p className="text-slate-400 text-sm text-center mb-6 max-w-2xl mx-auto">
          x402 on Stellar requires wallets that support{" "}
          <a
            href="https://developers.stellar.org/docs/build/guides/transactions/signing-soroban-invocations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline"
          >
            auth-entry signing
          </a>{" "}
          (Soroban authorization entry signing).
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {compatibleWallets.map((w) => (
            <span
              key={w}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-sm px-4 py-2 rounded-lg"
            >
              {w}
            </span>
          ))}
        </div>
      </section>

      {/* OpenZeppelin facilitator -- coming soon */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Facilitator</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-3xl mx-auto text-center">
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            <a
              href="https://www.openzeppelin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-semibold"
            >
              OpenZeppelin
            </a>{" "}
            is building a hosted Stellar facilitator using their{" "}
            <a
              href="https://github.com/OpenZeppelin/relayer-plugin-x402-facilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              Relayer x402 Facilitator Plugin
            </a>
            . Once live, you will be able to point your server at their facilitator URL instead of
            running your own.
          </p>
          <span className="inline-block bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Resources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {resources.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-sky-500/50 transition-colors block"
            >
              <h3 className="text-sm font-semibold text-sky-400 mb-1">{r.label}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{r.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
