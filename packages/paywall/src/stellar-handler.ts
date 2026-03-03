import type {
  PaywallNetworkHandler,
  PaywallConfig,
  PaymentRequirements,
  PaymentRequired,
} from "./types.js";
import { STELLAR_PAYWALL_TEMPLATE } from "./gen/template.js";

const USDC_PUBNET_ADDRESS = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const USDC_TESTNET_ADDRESS = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

function getChainConfig() {
  return {
    pubnet: { usdcAddress: USDC_PUBNET_ADDRESS, usdcName: "USDC" },
    testnet: { usdcAddress: USDC_TESTNET_ADDRESS, usdcName: "USDC" },
  };
}

interface StellarPaywallOptions {
  amount: number;
  testnet: boolean;
  paymentRequired: PaymentRequired;
  currentUrl: string;
  appName?: string;
  appLogo?: string;
}

/**
 * Serializes a value as JSON safe for embedding inside HTML `<script>` tags.
 *
 * Escapes `<` → `\u003c` so that a `</script>` sequence inside the data
 * cannot close the script block (the standard XSS vector for inline JSON).
 * The output is still valid JavaScript.
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getStellarPaywallHtml(options: StellarPaywallOptions): string {
  if (!STELLAR_PAYWALL_TEMPLATE) {
    return `<!DOCTYPE html><html><body><h1>Stellar Paywall template not available</h1></body></html>`;
  }

  const { amount, testnet, paymentRequired, currentUrl, appName, appLogo } = options;

  const logOnTestnet = testnet
    ? "console.log('Stellar Payment required initialized:', window.x402);"
    : "";

  const config = getChainConfig();

  const configScript = `
  <script>
    window.x402 = {
      amount: ${amount},
      paymentRequired: ${jsonForScript(paymentRequired)},
      testnet: ${testnet},
      currentUrl: ${jsonForScript(currentUrl)},
      config: {
        chainConfig: ${jsonForScript(config)},
      },
      appName: ${jsonForScript(appName || "")},
      appLogo: ${jsonForScript(appLogo || "")},
    };
    ${logOnTestnet}
  </script>`;

  return STELLAR_PAYWALL_TEMPLATE.replace("</head>", `${configScript}\n</head>`);
}

/**
 * Stellar network handler for the paywall builder.
 *
 * Supports any network starting with "stellar:" and generates a self-contained
 * HTML page with the Stellar wallet UI for completing payments.
 */
export const stellarPaywall: PaywallNetworkHandler = {
  supports(requirement: PaymentRequirements): boolean {
    return requirement.network.startsWith("stellar:");
  },

  generateHtml(
    requirement: PaymentRequirements,
    paymentRequired: PaymentRequired,
    config: PaywallConfig,
  ): string {
    // Stellar USDC uses 7 decimal places (stroops)
    const amount = requirement.amount
      ? parseFloat(requirement.amount) / 1e7
      : requirement.maxAmountRequired
        ? parseFloat(requirement.maxAmountRequired) / 1e7
        : 0;

    return getStellarPaywallHtml({
      amount,
      paymentRequired,
      currentUrl: paymentRequired.resource?.url || config.currentUrl || "",
      testnet: config.testnet ?? true,
      appName: config.appName,
      appLogo: config.appLogo,
    });
  },
};
