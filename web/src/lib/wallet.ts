import { BrowserProvider } from "ethers";
import { MONAD_TESTNET } from "../config/chains";

const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Wait for ethereum to be injected (mobile MetaMask has a slight delay)
const waitForEthereum = (timeout = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.ethereum) {
      resolve(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.ethereum) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(!!window.ethereum);
    }, timeout);
  });
};

export const hasMetaMask = (): boolean => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
};

// Generate MetaMask deep link for mobile browsers
export const getMetaMaskDeepLink = (): string => {
  const currentUrl = window.location.href;
  // MetaMask deep link format: https://metamask.app.link/dapp/{url_without_protocol}
  const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${urlWithoutProtocol}`;
};

// Open MetaMask app with deep link
export const openInMetaMask = (): void => {
  window.location.href = getMetaMaskDeepLink();
};

export async function getProvider(): Promise<BrowserProvider> {
  // Wait for ethereum injection on mobile
  if (isMobile()) {
    await waitForEthereum();
  }

  if (!window.ethereum) {
    if (isMobile()) {
      throw new Error(
        "OPEN_METAMASK" // Special error code for UI to handle
      );
    }
    throw new Error("MetaMask not detected. Please install MetaMask extension.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function connectWallet(): Promise<string> {
  // Wait for ethereum injection on mobile
  if (isMobile()) {
    const hasEth = await waitForEthereum();
    if (!hasEth) {
      throw new Error("OPEN_METAMASK");
    }
  }

  if (!window.ethereum) {
    throw new Error("OPEN_METAMASK");
  }

  await ensureMonadNetwork();

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts"
  })) as string[];

  if (!accounts[0]) {
    throw new Error("No wallet connected");
  }

  return accounts[0];
}

export async function ensureMonadNetwork(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET.chainIdHex }]
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: MONAD_TESTNET.chainIdHex,
          chainName: MONAD_TESTNET.name,
          rpcUrls: [MONAD_TESTNET.rpc],
          nativeCurrency: MONAD_TESTNET.currency,
          blockExplorerUrls: [MONAD_TESTNET.explorer]
        }
      ]
    });

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET.chainIdHex }]
    });
  }
}
