import { useCallback, useEffect, useRef, useState } from "react";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { formatDuration, getExplorerTxUrl, getNetworkDisplayName, truncateHash } from "./utils";
import { Spinner } from "./Spinner";
import { statusError, statusInfo, type Status } from "./status";
import { useStellarBalance } from "./useStellarBalance";
import { useStellarPayment, type PaymentReceipt } from "./useStellarPayment";
import { useSWKConnection } from "./useSWKConnection";
import { useSWKSigner } from "./useSWKSigner";

type StellarPaywallProps = {
  paymentRequired: PaymentRequired;
  onSuccessfulResponse: (response: Response) => Promise<void>;
};

type StellarPaywallMainProps = {
  paymentRequired: PaymentRequired;
  stellarRequirement: PaymentRequirements;
  onSuccessfulResponse: (response: Response) => Promise<void>;
};

const STELLAR_PAYMENT_SCALE = 10_000_000;

/**
 * How long the receipt stays up before the paid content takes over. The paid
 * response usually replaces the whole document, so without this pause the payer
 * never sees what they paid or the hash it settled under. Hosts can override it
 * with `receiptDelayMs`; `0` skips the receipt entirely and hands off at once.
 */
const DEFAULT_RECEIPT_DELAY_MS = 3000;

/**
 * Paywall experience for Stellar networks. Validates that a Stellar payment
 * requirement exists and either renders the error shell or delegates to the
 * main component.
 *
 * @param props - Component props.
 * @param props.paymentRequired - Payment required response with accepts array.
 * @param props.onSuccessfulResponse - Callback invoked on successful 402 response.
 * @returns JSX element.
 */
export function StellarPaywall({ paymentRequired, onSuccessfulResponse }: StellarPaywallProps) {
  const stellarRequirement = paymentRequired.accepts.find((r) => r.network.startsWith("stellar:"));

  if (!stellarRequirement) {
    return (
      <div className="container gap-8">
        <div className="header">
          <h1 className="title">Payment Required</h1>
        </div>
        <div className="content w-full">
          <div className="status status-error">
            No Stellar payment requirement found in paymentRequired.accepts
          </div>
        </div>
      </div>
    );
  }

  return (
    <StellarPaywallMain
      paymentRequired={paymentRequired}
      stellarRequirement={stellarRequirement}
      onSuccessfulResponse={onSuccessfulResponse}
    />
  );
}

/**
 * Main paywall component. Receives a guaranteed Stellar requirement and
 * handles wallet connection, balance fetching, and payment submission.
 *
 * @param props - Component props.
 * @param props.paymentRequired - Payment required response with accepts array.
 * @param props.stellarRequirement - Resolved Stellar payment requirement.
 * @param props.onSuccessfulResponse - Callback invoked on successful 402 response.
 * @returns JSX element.
 */
function StellarPaywallMain({
  paymentRequired,
  stellarRequirement,
  onSuccessfulResponse,
}: StellarPaywallMainProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const [hideBalance, setHideBalance] = useState(true);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  // Resolves the promise `onReceipt` returns, releasing the paid content.
  const continueRef = useRef<(() => void) | null>(null);

  const x402 = window.x402;
  const { network, asset } = stellarRequirement;
  const networkKey = network.split(":")[1] ?? "";
  const chainConfig = x402.config?.chainConfig;
  const assetCode = chainConfig?.[networkKey]?.usdcName || "USDC";
  const isTestnetUsdc =
    network === "stellar:testnet" && asset === chainConfig?.testnet?.usdcAddress;

  const { kitReady, address, connect, disconnect } = useSWKConnection({
    network,
    onStatus: setStatus,
  });

  const {
    isFetchingBalance,
    tokenBalanceFormatted,
    isMissingTrustline,
    assetMetadata,
    refreshBalance,
    resetBalance,
  } = useStellarBalance({
    address,
    network,
    asset,
    onStatus: setStatus,
  });

  const walletSigner = useSWKSigner({
    kitReady,
    network,
    address,
  });

  const receiptDelayMs = x402.config?.receiptDelayMs ?? DEFAULT_RECEIPT_DELAY_MS;

  const handleReceipt = useCallback(
    (settled: PaymentReceipt) => {
      if (receiptDelayMs <= 0) {
        return;
      }

      setReceipt(settled);

      return new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          continueRef.current = null;
          resolve();
        }, receiptDelayMs);

        continueRef.current = () => {
          window.clearTimeout(timer);
          continueRef.current = null;
          resolve();
        };
      });
    },
    [receiptDelayMs],
  );

  // A pending hand-off must never outlive the component, or the paid content
  // would never load.
  useEffect(() => () => continueRef.current?.(), []);

  const { isPaying, submitPayment } = useStellarPayment({
    paymentRequired,
    walletSigner,
    onSuccessfulResponse,
    setStatus,
    onReceipt: handleReceipt,
  });

  const amount =
    typeof x402.amount === "number"
      ? x402.amount
      : Number(stellarRequirement.amount) / STELLAR_PAYMENT_SCALE;

  const chainName = getNetworkDisplayName(network);

  const handleConnect = useCallback(async () => {
    await connect();
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    resetBalance();
    setStatus(
      statusInfo(
        "Wallet disconnected. To fully disconnect some wallets, you may need to disconnect from the wallet app itself.",
      ),
    );
  }, [disconnect, resetBalance]);

  const handlePayment = useCallback(async () => {
    if (!x402) {
      return;
    }

    if (!walletSigner || !address) {
      setStatus(statusError("Connect a Stellar wallet before paying."));
      return;
    }

    if (tokenBalanceFormatted === "") {
      setStatus(statusInfo(`Checking ${assetCode} balance...`));
      const freshBalance = await refreshBalance();
      if (Number(freshBalance) < amount) {
        setStatus(
          statusError(
            `Insufficient balance. Make sure you have enough ${assetCode} on ${chainName}.`,
          ),
        );
        return;
      }
    }

    try {
      await submitPayment();
    } catch (error) {
      setStatus(statusError(error instanceof Error ? error.message : "Payment failed."));
    }
  }, [
    x402,
    walletSigner,
    address,
    tokenBalanceFormatted,
    amount,
    assetCode,
    chainName,
    refreshBalance,
    submitPayment,
  ]);

  if (receipt) {
    // Prefer the network the facilitator reported, but fall back to the one the
    // requirement named — facilitators are not guaranteed to report it in CAIP-2
    // form, and losing the explorer link over that would defeat the receipt.
    const explorerUrl =
      getExplorerTxUrl(receipt.network, receipt.transaction) ??
      getExplorerTxUrl(network, receipt.transaction);

    return (
      <div className="container gap-8">
        <div className="header">
          <h1 className="title">Payment Settled</h1>
          <p>
            Paid ${amount} {assetCode} on {chainName}. Loading the content you paid for…
          </p>
        </div>

        <div className="content w-full">
          <div className="payment-details">
            <div className="payment-row">
              <span className="payment-label">Amount:</span>
              <span className="payment-value">
                ${amount} {assetCode}
              </span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Paid to:</span>
              <span className="payment-value receipt-mono">
                {truncateHash(stellarRequirement.payTo, 6)}
              </span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Transaction:</span>
              <span className="payment-value receipt-mono">
                {receipt.transaction ? (
                  explorerUrl ? (
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                      {truncateHash(receipt.transaction)} ↗
                    </a>
                  ) : (
                    truncateHash(receipt.transaction)
                  )
                ) : (
                  "not reported"
                )}
              </span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Settled in:</span>
              <span className="payment-value">{formatDuration(receipt.settlementMs)}</span>
            </div>
          </div>

          <div className="cta-container">
            <button
              className="button button-primary"
              onClick={() => continueRef.current?.()}
              autoFocus
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container gap-8">
      <div className="header">
        <h1 className="title">Payment Required</h1>
        <p>
          {paymentRequired.resource?.description && `${paymentRequired.resource.description}.`} To
          access this content, please pay ${amount} {chainName} {assetCode}.
          {isTestnetUsdc && (
            <span>
              {" "}
              <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
                Fund USDC ↗
              </a>
            </span>
          )}
        </p>
      </div>

      <div className="content w-full">
        <div className="payment-details">
          <div className="payment-row">
            <span className="payment-label">Wallet:</span>
            <span className="payment-value">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "-"}
            </span>
          </div>
          <div className="payment-row">
            <span className="payment-label">Available balance:</span>
            <span className="payment-value">
              {address ? (
                <button className="balance-button" onClick={() => setHideBalance((prev) => !prev)}>
                  {!hideBalance && tokenBalanceFormatted
                    ? `$${tokenBalanceFormatted} ${assetCode}`
                    : isFetchingBalance
                      ? "Loading..."
                      : `••••• ${assetCode}`}
                </button>
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="payment-row">
            <span className="payment-label">Amount:</span>
            <span className="payment-value">
              ${amount} {assetCode}
            </span>
          </div>
          <div className="payment-row">
            <span className="payment-label">Network:</span>
            <span className="payment-value">{chainName}</span>
          </div>
        </div>

        <div className="cta-container">
          {!address ? (
            <>
              {kitReady && (
                <button className="button button-primary" onClick={handleConnect}>
                  Connect Wallet
                </button>
              )}
              {!kitReady && <div className="status status-info">Loading wallet options...</div>}
            </>
          ) : (
            <>
              <button className="button button-secondary" onClick={handleDisconnect}>
                Disconnect
              </button>
              <button
                className="button button-primary"
                onClick={handlePayment}
                disabled={isPaying || isMissingTrustline === true}
              >
                {!isPaying ? "Pay" : <Spinner />}
              </button>
            </>
          )}
        </div>

        {status && <div className={`status status-${status.type}`}>{status.message}</div>}

        {address && isMissingTrustline && (
          <div className="trustline-banner">
            <div className="trustline-icon" aria-hidden="true">
              !
            </div>
            <div className="trustline-body">
              <p className="trustline-title">
                {assetMetadata ? assetMetadata.code : "Asset"} trustline required
              </p>
              <p className="trustline-text">
                Your account needs a <strong>{assetMetadata ? assetMetadata.code : "asset"}</strong>{" "}
                trustline before you can hold or pay with this asset. Add one via{" "}
                <a
                  href="https://lab.stellar.org/account/fund"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stellar Laboratory
                </a>
                : connect your wallet, add the {assetMetadata ? assetMetadata.code : "asset"}{" "}
                trustline, and sign the transaction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
