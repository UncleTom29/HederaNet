export { WalletProvider, useWallet } from "./wallet/index.js";
export type { WalletState, WalletContextValue } from "./wallet/index.js";

export {
  useHotspotStatus,
  useOperatorNotifications,
  useNetworkStats,
  useTradeStatus,
} from "./realtime/hooks.js";
export type {
  HotspotStatus,
  OperatorNotification,
  NetworkStats,
  TradeStatus,
} from "./realtime/hooks.js";
