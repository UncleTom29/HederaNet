"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type WalletProvider = "HashPack" | "Blade" | "WalletConnect";

export interface WalletState {
  accountId: string | null;
  isConnected: boolean;
  provider: WalletProvider | null;
  balance: number | null; // tinybars
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

// -----------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------

const WalletContext = createContext<WalletContextValue | null>(null);

// -----------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    accountId: null,
    isConnected: false,
    provider: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  // Restore persisted connection on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("hederanet:wallet");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<WalletState>;
        if (parsed.accountId && parsed.provider) {
          setState((prev) => ({
            ...prev,
            accountId: parsed.accountId ?? null,
            provider: parsed.provider ?? null,
            isConnected: true,
          }));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const connect = useCallback(async (provider: WalletProvider) => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      let accountId: string;

      switch (provider) {
        case "HashPack": {
          // HashConnect integration stub — real impl would call HashConnect SDK
          const hp = (window as unknown as Record<string, unknown>)["hashpack"] as
            | { connect: () => Promise<{ accountId: string }> }
            | undefined;
          if (!hp) throw new Error("HashPack extension not found");
          const result = await hp.connect();
          accountId = result.accountId;
          break;
        }
        case "Blade": {
          const blade = (window as unknown as Record<string, unknown>)["bladeSdk"] as
            | { createSession: () => Promise<{ accountId: string }> }
            | undefined;
          if (!blade) throw new Error("Blade wallet extension not found");
          const session = await blade.createSession();
          accountId = session.accountId;
          break;
        }
        case "WalletConnect": {
          // WalletConnect via HIP-820 pairing
          // Real impl: import WalletConnectModal and dAppConnector
          throw new Error("WalletConnect support coming soon");
        }
        default:
          throw new Error(`Unknown provider: ${String(provider)}`);
      }

      const newState: WalletState = {
        accountId,
        isConnected: true,
        provider,
        balance: null,
        isConnecting: false,
        error: null,
      };
      setState(newState);
      sessionStorage.setItem(
        "hederanet:wallet",
        JSON.stringify({ accountId, provider }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setState((prev) => ({ ...prev, isConnecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    sessionStorage.removeItem("hederanet:wallet");
    setState({
      accountId: null,
      isConnected: false,
      provider: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!state.isConnected || !state.provider) {
        throw new Error("Wallet not connected");
      }

      // Each provider has its own signing API
      switch (state.provider) {
        case "HashPack": {
          const hp = (window as unknown as Record<string, unknown>)["hashpack"] as
            | { signMessage: (msg: string) => Promise<{ signature: string }> }
            | undefined;
          if (!hp) throw new Error("HashPack not available");
          const res = await hp.signMessage(message);
          return res.signature;
        }
        default:
          throw new Error("signMessage not implemented for this provider");
      }
    },
    [state.isConnected, state.provider],
  );

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, signMessage }}>
      {children}
    </WalletContext.Provider>
  );
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
