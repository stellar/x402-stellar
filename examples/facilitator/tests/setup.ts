import { vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("FACILITATOR_STELLAR_PRIVATE_KEY", Keypair.random().secret());
