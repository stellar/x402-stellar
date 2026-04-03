import { describe, it, expect } from "vitest";
import { validatePaymentPayload, validatePaymentRequirements } from "../../src/utils/validation.js";

const validPayload = {
  x402Version: 1,
  accepted: {
    scheme: "exact",
    network: "stellar:testnet",
    asset: "native",
    amount: "100",
    payTo: "G...",
    maxTimeoutSeconds: 60,
    extra: {},
  },
  payload: { signature: "mock" },
};

const validRequirements = {
  scheme: "exact",
  network: "stellar:testnet",
  asset: "native",
  amount: "100",
  payTo: "GABCDEF",
  maxTimeoutSeconds: 60,
  extra: {},
};

describe("validatePaymentPayload", () => {
  it("returns null for a valid payload", () => {
    expect(validatePaymentPayload(validPayload)).toBeNull();
  });

  it("returns null for a valid payload with optional fields", () => {
    expect(
      validatePaymentPayload({
        ...validPayload,
        resource: { url: "http://x" },
        extensions: { foo: 1 },
      }),
    ).toBeNull();
  });

  // non-object rejection
  it.each([null, undefined, "string", 42, true, [1, 2]])(
    "rejects non-object value: %s",
    (value) => {
      expect(validatePaymentPayload(value)).toBe("paymentPayload must be a non-null object");
    },
  );

  // x402Version
  it("rejects when x402Version is missing", () => {
    const { x402Version: _, ...rest } = validPayload;
    expect(validatePaymentPayload(rest)).toBe("paymentPayload.x402Version must be a number");
  });

  it("rejects when x402Version is a string", () => {
    expect(validatePaymentPayload({ ...validPayload, x402Version: "1" })).toBe(
      "paymentPayload.x402Version must be a number",
    );
  });

  // payload
  it("rejects when payload is missing", () => {
    const { payload: _, ...rest } = validPayload;
    expect(validatePaymentPayload(rest)).toBe("paymentPayload.payload must be an object");
  });

  it("rejects when payload is null", () => {
    expect(validatePaymentPayload({ ...validPayload, payload: null })).toBe(
      "paymentPayload.payload must be an object",
    );
  });

  it("rejects when payload is an array", () => {
    expect(validatePaymentPayload({ ...validPayload, payload: [1] })).toBe(
      "paymentPayload.payload must be an object",
    );
  });

  it("rejects when payload is a string", () => {
    expect(validatePaymentPayload({ ...validPayload, payload: "bad" })).toBe(
      "paymentPayload.payload must be an object",
    );
  });

  // accepted
  it("rejects when accepted is missing", () => {
    const { accepted: _, ...rest } = validPayload;
    expect(validatePaymentPayload(rest)).toBe("paymentPayload.accepted must be an object");
  });

  it("rejects when accepted is a string", () => {
    expect(validatePaymentPayload({ ...validPayload, accepted: "bad" })).toBe(
      "paymentPayload.accepted must be an object",
    );
  });

  it("rejects when accepted is an array", () => {
    expect(validatePaymentPayload({ ...validPayload, accepted: [] })).toBe(
      "paymentPayload.accepted must be an object",
    );
  });
});

describe("validatePaymentRequirements", () => {
  it("returns null for valid requirements", () => {
    expect(validatePaymentRequirements(validRequirements)).toBeNull();
  });

  // non-object rejection
  it.each([null, undefined, "string", 42, true, [1]])("rejects non-object value: %s", (value) => {
    expect(validatePaymentRequirements(value)).toBe(
      "paymentRequirements must be a non-null object",
    );
  });

  // scheme — left side (wrong type) and right side (empty string) of ||
  it("rejects when scheme is a non-string type", () => {
    expect(validatePaymentRequirements({ ...validRequirements, scheme: 123 })).toContain("scheme");
  });

  it("rejects when scheme is an empty string", () => {
    expect(validatePaymentRequirements({ ...validRequirements, scheme: "" })).toContain("scheme");
  });

  it("rejects when scheme is missing", () => {
    const { scheme: _, ...rest } = validRequirements;
    expect(validatePaymentRequirements(rest)).toContain("scheme");
  });

  // network — left side (wrong type) and right side (missing colon)
  it("rejects when network is a non-string type", () => {
    expect(validatePaymentRequirements({ ...validRequirements, network: 42 })).toContain("network");
  });

  it("rejects when network has no colon separator", () => {
    expect(validatePaymentRequirements({ ...validRequirements, network: "badnetwork" })).toContain(
      "network",
    );
  });

  it("rejects when network is missing", () => {
    const { network: _, ...rest } = validRequirements;
    expect(validatePaymentRequirements(rest)).toContain("network");
  });

  // payTo — left side (wrong type) and right side (empty string)
  it("rejects when payTo is a non-string type", () => {
    expect(validatePaymentRequirements({ ...validRequirements, payTo: 0 })).toContain("payTo");
  });

  it("rejects when payTo is an empty string", () => {
    expect(validatePaymentRequirements({ ...validRequirements, payTo: "" })).toContain("payTo");
  });

  // amount — left side (wrong type) and right side (empty string)
  it("rejects when amount is a non-string type", () => {
    expect(validatePaymentRequirements({ ...validRequirements, amount: 100 })).toContain("amount");
  });

  it("rejects when amount is an empty string", () => {
    expect(validatePaymentRequirements({ ...validRequirements, amount: "" })).toContain("amount");
  });

  // asset — left side (wrong type) and right side (empty string)
  it("rejects when asset is a non-string type", () => {
    expect(validatePaymentRequirements({ ...validRequirements, asset: null })).toContain("asset");
  });

  it("rejects when asset is an empty string", () => {
    expect(validatePaymentRequirements({ ...validRequirements, asset: "" })).toContain("asset");
  });

  // maxTimeoutSeconds — left side (wrong type) and right side (<= 0)
  it("rejects when maxTimeoutSeconds is a string", () => {
    expect(
      validatePaymentRequirements({ ...validRequirements, maxTimeoutSeconds: "60" }),
    ).toContain("maxTimeoutSeconds");
  });

  it("rejects when maxTimeoutSeconds is zero", () => {
    expect(validatePaymentRequirements({ ...validRequirements, maxTimeoutSeconds: 0 })).toContain(
      "maxTimeoutSeconds",
    );
  });

  it("rejects when maxTimeoutSeconds is negative", () => {
    expect(validatePaymentRequirements({ ...validRequirements, maxTimeoutSeconds: -1 })).toContain(
      "maxTimeoutSeconds",
    );
  });

  // extra — various non-object values
  it("rejects when extra is null", () => {
    expect(validatePaymentRequirements({ ...validRequirements, extra: null })).toContain("extra");
  });

  it("rejects when extra is an array", () => {
    expect(validatePaymentRequirements({ ...validRequirements, extra: [] })).toContain("extra");
  });

  it("rejects when extra is a string", () => {
    expect(validatePaymentRequirements({ ...validRequirements, extra: "bad" })).toContain("extra");
  });

  it("rejects when extra is missing", () => {
    const { extra: _, ...rest } = validRequirements;
    expect(validatePaymentRequirements(rest)).toContain("extra");
  });
});
