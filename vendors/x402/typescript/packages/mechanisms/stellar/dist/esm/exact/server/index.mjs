import {
  DEFAULT_TOKEN_DECIMALS,
  convertToTokenAmount,
  getUsdcAddress
} from "../../chunk-YFZMLK7W.mjs";

// src/exact/server/scheme.ts
var ExactStellarScheme = class {
  constructor() {
    this.scheme = "exact";
    this.moneyParsers = [];
  }
  /**
   * Register a custom money parser in the parser chain.
   * Multiple parsers can be registered - they will be tried in registration order.
   * Each parser receives a decimal amount (e.g., 1.50 for $1.50).
   * If a parser returns null, the next parser in the chain will be tried.
   * The default parser is always the final fallback.
   *
   * @param parser - Custom function to convert amount to AssetAmount (or null to skip)
   * @returns The service instance for chaining
   */
  registerMoneyParser(parser) {
    this.moneyParsers.push(parser);
    return this;
  }
  /**
   * Parses a price into `AssetAmount`.
   * If price is already an `AssetAmount`, returns it directly.
   * If price is `Money` (string | number), parses to decimal and tries custom parsers.
   * If no custom parsers return a valid `AssetAmount`, falls back to default conversion, assuming USDC token contract.
   *
   * @param price - The `Price` to parse
   * @param network - The `Network` to use
   * @returns Promise that resolves to the parsed `AssetAmount`
   */
  async parsePrice(price, network) {
    if (typeof price === "object" && price !== null && "amount" in price) {
      if (!price.asset) {
        throw new Error(`Asset address must be specified for AssetAmount on network ${network}`);
      }
      return {
        amount: price.amount,
        asset: price.asset,
        extra: price.extra || {}
      };
    }
    const amount = this.parseMoneyToDecimal(price);
    for (const parser of this.moneyParsers) {
      const result = await parser(amount, network);
      if (result !== null) {
        return result;
      }
    }
    return this.defaultMoneyConversion(amount, network);
  }
  /**
   * Build payment requirements for this scheme/network combination
   *
   * @param paymentRequirements - The base payment requirements
   * @param supportedKind - The supported kind configuration
   * @param supportedKind.x402Version - The x402 protocol version
   * @param supportedKind.scheme - The payment scheme
   * @param supportedKind.network - The network identifier
   * @param supportedKind.extra - Extra metadata including `areFeesSponsored` from facilitator
   * @param extensionKeys - Extension keys supported by the facilitator
   * @returns Enhanced payment requirements with `areFeesSponsored` in extra
   */
  enhancePaymentRequirements(paymentRequirements, supportedKind, extensionKeys) {
    void extensionKeys;
    const areFeesSponsored = supportedKind.extra?.areFeesSponsored;
    return Promise.resolve({
      ...paymentRequirements,
      extra: {
        ...paymentRequirements.extra,
        ...typeof areFeesSponsored === "boolean" && { areFeesSponsored }
      }
    });
  }
  /**
   * Parse Money (string | number) to a decimal number.
   * Handles formats like "$1.50", "1.50", 1.50, etc.
   *
   * @param money - The money value to parse
   * @returns Decimal number
   */
  parseMoneyToDecimal(money) {
    if (typeof money === "number") {
      return money;
    }
    const cleanMoney = money.replace(/^\$/, "").trim();
    const amount = parseFloat(cleanMoney);
    if (isNaN(amount)) {
      throw new Error(`Invalid money format: ${money}`);
    }
    return amount;
  }
  /**
   * Default money conversion implementation.
   * Converts decimal amount to USDC on the specified network.
   *
   * @param amount - The decimal amount (e.g., 1.50)
   * @param network - The network to use
   * @returns The parsed asset amount in USDC
   */
  defaultMoneyConversion(amount, network) {
    const tokenAmount = convertToTokenAmount(amount.toString(), DEFAULT_TOKEN_DECIMALS);
    return {
      amount: tokenAmount,
      asset: getUsdcAddress(network),
      extra: {}
    };
  }
};
export {
  ExactStellarScheme
};
//# sourceMappingURL=index.mjs.map