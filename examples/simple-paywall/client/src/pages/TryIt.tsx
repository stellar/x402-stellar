import { SERVER_URL } from "../constants.ts";

const steps = [
  { step: "1", text: "Click the button below to request the protected resource." },
  {
    step: "2",
    text: "The server responds with HTTP 402 and a paywall page. Connect a compatible wallet (e.g. Freighter browser extension).",
  },
  { step: "3", text: "Approve a $0.01 USDC payment on Stellar testnet." },
  {
    step: "4",
    text: "The facilitator verifies and settles the payment on-chain. The content unlocks automatically.",
  },
];

export function TryIt() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-white mb-4">Try the Paywall Demo</h1>
      <p className="text-lg text-slate-400 mb-10">
        This demo gates a page behind a $0.01 USDC micropayment on Stellar testnet. When you request
        the protected resource, the server returns HTTP 402 with a paywall page where you can sign
        and submit the payment.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">How it works</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center text-sm font-bold">
                {s.step}
              </span>
              <p className="text-slate-300 pt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold text-white mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
          <li>
            A wallet that supports{" "}
            <a
              href="https://developers.stellar.org/docs/build/guides/transactions/signing-soroban-invocations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              auth-entry signing
            </a>{" "}
            (e.g. Freighter browser extension, Albedo, Hana)
          </li>
          <li>
            A funded Stellar testnet account with the USDC trustline &ndash; to fund it or add a
            trustline, go to{" "}
            <a
              href="https://lab.stellar.org/account/fund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              Stellar Laboratory
            </a>
          </li>
          <li>
            Testnet USDC tokens &ndash; get them from the{" "}
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline"
            >
              Circle Faucet
            </a>{" "}
            (select Stellar network)
          </li>
        </ul>
      </section>

      <a
        href={`${SERVER_URL}/protected`}
        className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        Access Protected Content
      </a>
    </div>
  );
}
