import { Link } from "react-router";
import { PAYMENT_PRICE, SERVER_URL } from "../constants.ts";

const steps = [
  { step: "1", text: "Click the button above to request the protected resource." },
  {
    step: "2",
    text: "The server responds with HTTP 402 and a paywall page. Connect a compatible wallet (e.g. Freighter browser extension).",
  },
  { step: "3", text: `Approve a $${PAYMENT_PRICE} USDC payment on Stellar testnet.` },
  {
    step: "4",
    text: "The facilitator verifies and settles the payment on-chain. The content unlocks automatically.",
  },
];

export function TryIt() {
  return (
    <div className="max-w-[960px] mx-auto px-6 lg:px-8 py-[80px] flex flex-col gap-[48px]">
      <div className="flex flex-col gap-[16px]">
        <Link
          to="/"
          className="w-[50px] h-[50px] rounded-[8px] border border-[#e2e2e2] bg-[#fcfcfc] flex items-center justify-center text-lg"
          aria-label="Back to home"
        >
          ←
        </Link>
        <h1 className="text-[40px] leading-[48px] font-semibold tracking-[-1.6px]">
          Try the Paywall Demo
        </h1>
        <p className="text-[16px] leading-[24px] text-[#171717] font-medium">
          This demo gates a page behind a ${PAYMENT_PRICE} USDC micropayment on Stellar testnet.
          When you request the protected resource, the server returns HTTP 402 with a paywall page
          where you can sign and submit the payment.
        </p>
        <div>
          <a
            href={`${SERVER_URL}/protected`}
            className="bg-[#171717] text-white text-[14px] leading-[20px] font-semibold rounded-[8px] px-[16px] py-[8px] inline-flex items-center gap-2"
          >
            Access Protected Content
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <section className="flex flex-col gap-[24px]">
        <h2 className="text-[24px] leading-[32px] font-semibold tracking-[-0.96px]">
          How it works
        </h2>
        <div className="flex flex-col gap-[16px]">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex gap-[12px] items-start text-[16px] leading-[24px] font-medium"
            >
              <span className="w-[24px] h-[24px] rounded-full border border-[#e2e2e2] flex items-center justify-center text-[14px] font-semibold shrink-0">
                {s.step}
              </span>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f5f2ff] border border-[#d7cff9] rounded-[8px] p-[24px] flex flex-col gap-[16px]">
        <h2 className="text-[24px] leading-[32px] font-semibold tracking-[-0.96px]">
          Prerequisites
        </h2>
        <ul className="list-disc list-inside flex flex-col gap-[12px] text-[16px] leading-[24px] font-medium">
          <li>
            A wallet that supports{" "}
            <a
              href="https://developers.stellar.org/docs/build/guides/transactions/signing-soroban-invocations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5746af] font-medium inline-flex items-center gap-1"
            >
              auth-entry signing
              <span aria-hidden>↗</span>
            </a>{" "}
            (e.g. Freighter browser extension, Albedo, Hana)
          </li>
          <li>
            A funded Stellar testnet account with the USDC trustline - to fund it or add a
            trustline, go to{" "}
            <a
              href="https://lab.stellar.org/account/fund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5746af] font-medium inline-flex items-center gap-1"
            >
              Stellar Laboratory
              <span aria-hidden>↗</span>
            </a>
          </li>
          <li>
            Testnet USDC tokens - get them from the{" "}
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5746af] font-medium inline-flex items-center gap-1"
            >
              Circle Faucet
              <span aria-hidden>↗</span>
            </a>{" "}
            (select Stellar network)
          </li>
        </ul>
      </section>
    </div>
  );
}
