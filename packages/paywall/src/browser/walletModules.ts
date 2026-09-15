import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { KleverModule } from "@creit.tech/stellar-wallets-kit/modules/klever";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { OneKeyModule } from "@creit.tech/stellar-wallets-kit/modules/onekey";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import type { ModuleInterface } from "@creit.tech/stellar-wallets-kit/types";
import { resolveWalletIds, type WalletId } from "./walletIds";

/**
 * One factory per supported wallet. Typed as `Record<WalletId, ...>` so adding
 * an id to `SUPPORTED_WALLET_IDS` without wiring up its module is a build
 * error rather than a runtime crash inside the wallet modal.
 */
const WALLET_MODULE_FACTORIES: Record<WalletId, () => ModuleInterface> = {
  freighter: () => new FreighterModule(),
  xbull: () => new xBullModule(),
  lobstr: () => new LobstrModule(),
  albedo: () => new AlbedoModule(),
  rabet: () => new RabetModule(),
  hana: () => new HanaModule(),
  klever: () => new KleverModule(),
  onekey: () => new OneKeyModule(),
};

/**
 * Resolves configured wallet ids into Stellar Wallets Kit modules.
 *
 * @param walletIds - Ids from `window.x402.config.wallets`; omit for the default set.
 * @returns Instantiated modules, in the order requested.
 */
export function resolveWalletModules(walletIds?: string[]): ModuleInterface[] {
  return resolveWalletIds(walletIds).map((id) => WALLET_MODULE_FACTORIES[id]());
}
