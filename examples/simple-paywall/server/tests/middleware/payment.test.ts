import { describe, it, expect, vi } from "vitest";
import { createRoundRobinKeySelector } from "../../src/middleware/payment.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("createRoundRobinKeySelector", () => {
  it("returns keys in round-robin order", () => {
    const getKey = createRoundRobinKeySelector("key-a,key-b,key-c");
    expect(getKey()).toBe("key-a");
    expect(getKey()).toBe("key-b");
    expect(getKey()).toBe("key-c");
  });

  it("wraps around after exhausting all keys", () => {
    const getKey = createRoundRobinKeySelector("key-a,key-b");
    expect(getKey()).toBe("key-a");
    expect(getKey()).toBe("key-b");
    expect(getKey()).toBe("key-a");
    expect(getKey()).toBe("key-b");
  });

  it("works with a single key", () => {
    const getKey = createRoundRobinKeySelector("only-key");
    expect(getKey()).toBe("only-key");
    expect(getKey()).toBe("only-key");
    expect(getKey()).toBe("only-key");
  });

  it("throws when given an empty string", () => {
    expect(() => createRoundRobinKeySelector("")).toThrow(
      "FACILITATOR_API_KEY must contain at least one non-empty key",
    );
  });

  it("throws when given only commas", () => {
    expect(() => createRoundRobinKeySelector(",,,")).toThrow(
      "FACILITATOR_API_KEY must contain at least one non-empty key",
    );
  });

  it("skips empty entries from trailing commas", () => {
    const getKey = createRoundRobinKeySelector("key-a,,key-b,");
    expect(getKey()).toBe("key-a");
    expect(getKey()).toBe("key-b");
    expect(getKey()).toBe("key-a");
  });
});
