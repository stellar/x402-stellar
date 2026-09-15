import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { resolveWalletIds, SUPPORTED_WALLET_IDS } from "./walletIds.ts";

describe("SUPPORTED_WALLET_IDS", () => {
  it("keeps Freighter first so the most common wallet leads the modal", () => {
    assert.equal(SUPPORTED_WALLET_IDS[0], "freighter");
  });

  it("covers the wallets the Stellar ecosystem actually uses", () => {
    for (const id of ["freighter", "xbull", "lobstr", "albedo", "rabet", "hana"]) {
      assert.ok(SUPPORTED_WALLET_IDS.includes(id as never), `${id} should be offered`);
    }
  });

  it("has no duplicate ids", () => {
    assert.equal(new Set(SUPPORTED_WALLET_IDS).size, SUPPORTED_WALLET_IDS.length);
  });
});

describe("resolveWalletIds", () => {
  it("offers every supported wallet when nothing is configured", () => {
    assert.deepEqual(resolveWalletIds(), [...SUPPORTED_WALLET_IDS]);
    assert.deepEqual(resolveWalletIds([]), [...SUPPORTED_WALLET_IDS]);
  });

  it("returns only the configured wallets, in the configured order", () => {
    assert.deepEqual(resolveWalletIds(["lobstr", "freighter"]), ["lobstr", "freighter"]);
  });

  it("accepts ids regardless of case or surrounding whitespace", () => {
    assert.deepEqual(resolveWalletIds([" xBull ", "ALBEDO"]), ["xbull", "albedo"]);
  });

  it("de-duplicates repeated ids", () => {
    assert.deepEqual(resolveWalletIds(["freighter", "freighter"]), ["freighter"]);
  });

  it("drops unknown ids with a warning instead of throwing", () => {
    const warn = mock.method(console, "warn", () => {});
    try {
      assert.deepEqual(resolveWalletIds(["freighter", "definitely-not-a-wallet"]), ["freighter"]);
      assert.equal(warn.mock.callCount(), 1);
    } finally {
      warn.mock.restore();
    }
  });

  it("falls back to every wallet when no configured id is usable", () => {
    const warn = mock.method(console, "warn", () => {});
    try {
      assert.deepEqual(resolveWalletIds(["nope", "also-nope"]), [...SUPPORTED_WALLET_IDS]);
    } finally {
      warn.mock.restore();
    }
  });
});
