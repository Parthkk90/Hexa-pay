import { Wallet, HDNodeWallet, JsonRpcProvider, formatEther, Mnemonic } from "ethers";
import { MONAD_TESTNET } from "../config/chains";

const STORAGE_KEY = "hexa_embedded_wallet";

export interface EmbeddedWalletState {
  address: string;
  hasPrivateKey: boolean;
  balance: string;
}

// Get or create embedded wallet
export function getEmbeddedWallet(): Wallet | HDNodeWallet {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    try {
      const { privateKey } = JSON.parse(stored);
      const provider = new JsonRpcProvider(MONAD_TESTNET.rpc);
      return new Wallet(privateKey, provider);
    } catch {
      // Invalid stored data, create new
    }
  }
  
  // Create new wallet
  const wallet = Wallet.createRandom();
  const provider = new JsonRpcProvider(MONAD_TESTNET.rpc);
  const connectedWallet = wallet.connect(provider);
  
  // Store for persistence
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    privateKey: wallet.privateKey,
    address: wallet.address
  }));
  
  return connectedWallet;
}

// Check if embedded wallet exists
export function hasEmbeddedWallet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Get embedded wallet address (without exposing private key)
export function getEmbeddedWalletAddress(): string | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const { address } = JSON.parse(stored);
      return address;
    } catch {
      return null;
    }
  }
  return null;
}

// Get wallet balance
export async function getEmbeddedWalletBalance(): Promise<string> {
  const wallet = getEmbeddedWallet();
  const provider = wallet.provider;
  if (!provider) return "0";
  
  const balance = await provider.getBalance(wallet.address);
  return formatEther(balance);
}

// Export private key (for backup - show warning!)
export function exportPrivateKey(): string | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const { privateKey } = JSON.parse(stored);
      return privateKey;
    } catch {
      return null;
    }
  }
  return null;
}

// Import existing wallet from private key
export function importWallet(privateKey: string): Wallet {
  const provider = new JsonRpcProvider(MONAD_TESTNET.rpc);
  const wallet = new Wallet(privateKey, provider);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    privateKey: wallet.privateKey,
    address: wallet.address
  }));
  
  return wallet;
}

// Import wallet from mnemonic phrase
export function importWalletFromMnemonic(mnemonicPhrase: string): HDNodeWallet {
  const provider = new JsonRpcProvider(MONAD_TESTNET.rpc);
  const mnemonic = Mnemonic.fromPhrase(mnemonicPhrase.trim());
  const wallet = HDNodeWallet.fromMnemonic(mnemonic);
  const connectedWallet = wallet.connect(provider);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    privateKey: wallet.privateKey,
    address: wallet.address
  }));
  
  return connectedWallet;
}

// Clear embedded wallet
export function clearEmbeddedWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Check if wallet has enough gas
export async function hasEnoughGas(minAmount: string = "0.001"): Promise<boolean> {
  const balance = await getEmbeddedWalletBalance();
  return parseFloat(balance) >= parseFloat(minAmount);
}
