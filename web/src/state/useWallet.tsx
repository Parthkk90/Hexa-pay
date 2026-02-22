import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type WalletContextValue = {
  walletAddress: string;
  setWalletAddress: (value: string) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState("");
  const value = useMemo(() => ({ walletAddress, setWalletAddress }), [walletAddress]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
}
