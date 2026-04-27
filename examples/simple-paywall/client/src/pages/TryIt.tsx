import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PAYMENT_PRICE, SERVER_URL } from "../constants.ts";

const NETWORK_DISPLAY_NAMES: Record<string, string> = {
  "stellar:testnet": "Testnet",
  "stellar:pubnet": "Mainnet",
};

const NETWORK_ROUTE_SUFFIXES: Record<string, string> = {
  "stellar:testnet": "testnet",
  "stellar:pubnet": "mainnet",
};

type NetworksStatus = "loading" | "ready" | "error";

function useAvailableNetworks(): { networks: string[]; status: NetworksStatus } {
  const [networks, setNetworks] = useState<string[]>([]);
  const [status, setStatus] = useState<NetworksStatus>("loading");

  useEffect(() => {
    fetch(`${SERVER_URL}/networks`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /networks responded with ${r.status}`);
        return r.json();
      })
      .then((data: { networks: string[] }) => {
        setNetworks(data.networks);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to fetch available networks:", err);
        setStatus("error");
      });
  }, []);

  return { networks, status };
}

function displayName(network: string): string {
  return NETWORK_DISPLAY_NAMES[network] ?? network;
}

function routeSuffix(network: string): string | undefined {
  return NETWORK_ROUTE_SUFFIXES[network];
}

function buildSteps(networks: string[]) {
  const hasTestnet = networks.includes("stellar:testnet");
  const hasMainnet = networks.includes("stellar:pubnet");

  let networkName: string;
  if (hasTestnet && hasMainnet) {
    networkName = "Stellar testnet or mainnet";
  } else if (hasMainnet) {
    networkName = "Stellar mainnet";
  } else {
    networkName = "Stellar testnet";
  }

  return [
    { step: "1", text: "Click one of the buttons above to request the protected resource." },
    {
      step: "2",
      text: "The server responds with HTTP 402 and a paywall page. Connect a compatible wallet (e.g. Freighter browser extension).",
    },
    { step: "3", text: `Approve a $${PAYMENT_PRICE} USDC payment on ${networkName}.` },
    {
      step: "4",
      text: "The facilitator verifies and settles the payment on-chain. The content unlocks automatically.",
    },
  ];
}

export function TryIt() {
  const { networks, status } = useAvailableNetworks();
  const steps = buildSteps(networks);

  return (
    <div className="max-w-[960px] mx-auto px-6 lg:px-8 py-[80px] flex flex-col gap-[80px]">
      <div className="flex flex-col gap-[24px]">
        <Link
          to="/"
          className="w-[50px] h-[50px] rounded-[8px] border border-line bg-surface flex items-center justify-center text-lg"
          aria-label="Back to home"
        >
          ←
        </Link>
        <h1 className="text-[40px] leading-[48px] font-semibold tracking-[-1.6px]">
          Try the Paywall Demo
        </h1>
        <p className="text-[16px] leading-[24px] text-fg font-normal">
          This demo gates a page behind a ${PAYMENT_PRICE} USDC micropayment on Stellar. When you
          request the protected resource, the server returns HTTP 402 with a paywall page where you
          can sign and submit the payment.
        </p>
        <div className="flex flex-wrap gap-[12px]">
          {status === "loading" && (
            <span className="text-[14px] text-muted font-medium">Loading available networks…</span>
          )}
          {status === "error" && (
            <span className="text-[14px] text-error font-medium">
              Could not reach the server. Check that the server is running and reload the page.
            </span>
          )}
          {status === "ready" && networks.length === 0 && (
            <span className="text-[14px] text-muted font-medium">
              No networks configured. Set TESTNET_* or MAINNET_* env vars on the server.
            </span>
          )}
          {networks
            .filter((n) => routeSuffix(n) !== undefined)
            .map((n) => (
              <a
                key={n}
                href={`${SERVER_URL}/protected/${routeSuffix(n)}`}
                className="bg-action text-action-fg text-[14px] leading-[20px] font-semibold rounded-[8px] px-[12px] py-[8px] inline-flex items-center gap-2"
              >
                Unlock Content ({displayName(n)})<span aria-hidden>→</span>
              </a>
            ))}
        </div>
      </div>

      <section className="flex flex-col gap-[24px]">
        <h2 className="text-[24px] leading-[32px] font-semibold tracking-[-0.96px]">
          How it works
        </h2>
        {steps.map((s) => (
          <div
            key={s.step}
            className="flex gap-[8px] items-start text-[16px] leading-[24px] font-medium"
          >
            <span className="w-[24px] h-[24px] rounded-full border border-line flex items-center justify-center text-[14px] font-semibold shrink-0">
              {s.step}
            </span>
            <p>{s.text}</p>
          </div>
        ))}
      </section>

      <section className="bg-brand-tint border border-brand-subtle rounded-[8px] p-[24px] flex flex-col gap-[24px]">
        <h2 className="text-[24px] leading-[32px] font-semibold tracking-[-0.96px]">
          Prerequisites
        </h2>
        <ul className="list-disc list-inside flex flex-col gap-[24px] text-[16px] leading-[24px] font-medium">
          <li>
            A wallet that supports{" "}
            <a
              href="https://developers.stellar.org/docs/build/guides/transactions/signing-soroban-invocations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium inline-flex items-center gap-1"
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
              className="text-brand font-medium inline-flex items-center gap-1"
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
              className="text-brand font-medium inline-flex items-center gap-1"
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
