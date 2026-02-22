export const MONAD_TESTNET = {
  chainId: 10143,
  chainIdHex: "0x279F",
  name: "Monad Testnet",
  rpc: (import.meta.env.VITE_MONAD_RPC_URL as string) || "https://testnet-rpc.monad.xyz",
  explorer: (import.meta.env.VITE_MONAD_EXPLORER as string) || "https://testnet.monadexplorer.com",
  currency: {
    name: "MON",
    symbol: "MON",
    decimals: 18
  }
};
