import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { useWallet } from "../state/useWallet";
import { connectWallet, getProvider, openInMetaMask } from "../lib/wallet";
import { getCredit, getUsdc, getCreditManager, type CreditSnapshot } from "../lib/contracts";
import { toUSDC, formatUSDC } from "../utils/usdcUtils";
import { CREDIT_MANAGER_ADDRESS } from "../config/contracts";
import { getEmbeddedWallet, getEmbeddedWalletBalance, importWalletFromMnemonic } from "../lib/embeddedWallet";

type Step = "connect" | "approve" | "complete";
type WalletMode = "none" | "metamask" | "embedded";

function BorrowerDashboard() {
  const wallet = useWallet();
  const [step, setStep] = useState<Step>("connect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [usdcBalance, setUsdcBalance] = useState(0n);
  const [credit, setCredit] = useState<CreditSnapshot | null>(null);
  const [stakeAmount, setStakeAmount] = useState("100");
  const [walletMode, setWalletMode] = useState<WalletMode>("none");
  const [showImportForm, setShowImportForm] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState("");

  useEffect(() => {
    if (wallet.walletAddress) {
      refreshData(wallet.walletAddress);
      
      // Poll credit data every 5 seconds for live updates
      const interval = setInterval(() => {
        refreshData(wallet.walletAddress);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [wallet.walletAddress]);

  const refreshData = async (addr: string) => {
    try {
      const p = await getProvider();
      setProvider(p);

      const usdc = await getUsdc(p);
      const balance = (await usdc.balanceOf(addr)) as bigint;
      setUsdcBalance(balance);

      const creditData = await getCredit(p, addr);
      setCredit(creditData);
    } catch (err) {
      console.warn("Refresh error:", err);
    }
  };

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [showMetaMaskLink, setShowMetaMaskLink] = useState(false);
  const [showInstallLink, setShowInstallLink] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");
      setShowMetaMaskLink(false);
      setShowInstallLink(false);
      const address = await connectWallet();
      wallet.setWalletAddress(address);
      setWalletMode("metamask");
      setStep("approve");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect";
      if (errorMsg === "OPEN_METAMASK") {
        if (isMobileDevice) {
          setError("MetaMask not detected. Tap the button below to open in MetaMask app.");
          setShowMetaMaskLink(true);
        } else {
          setError("MetaMask not detected. Install MetaMask extension to continue.");
          setShowInstallLink(true);
        }
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmbeddedConnect = async () => {
    try {
      setLoading(true);
      setError("");
      const ew = getEmbeddedWallet();
      wallet.setWalletAddress(ew.address);
      setWalletMode("embedded");
      setStep("approve");
      
      const balance = await getEmbeddedWalletBalance();
      if (parseFloat(balance) < 0.001) {
        setError(`Embedded wallet needs gas. Send MON to: ${ew.address}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleImportMnemonic = async () => {
    try {
      setLoading(true);
      setError("");
      if (!mnemonicInput.trim()) {
        setError("Enter mnemonic phrase");
        return;
      }
      
      const ew = importWalletFromMnemonic(mnemonicInput.trim());
      wallet.setWalletAddress(ew.address);
      setWalletMode("embedded");
      setShowImportForm(false);
      setMnemonicInput("");
      setStep("approve");
      
      const balance = await getEmbeddedWalletBalance();
      if (parseFloat(balance) < 0.001) {
        setError(`Wallet needs gas. Send MON to: ${ew.address}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid mnemonic");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!wallet.walletAddress || !provider) return;

    try {
      setLoading(true);
      setError("");

      const usdc = await getUsdc(provider);
      const amountToApprove = toUSDC(Number(stakeAmount));
      const tx = await usdc.approve(CREDIT_MANAGER_ADDRESS, amountToApprove);

      await tx.wait();
      setStep("complete");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!wallet.walletAddress || !provider) return;

    try {
      setLoading(true);
      setError("");

      const creditManager = await getCreditManager(provider);
      const stakeAmountWei = toUSDC(Number(stakeAmount));
      const tx = await creditManager.stakeCollateral(stakeAmountWei);

      await tx.wait();

      await refreshData(wallet.walletAddress);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stake");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Borrower Dashboard</h1>
          <p className="text-dim">Stake USDC collateral to open your credit line</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "12px", borderRadius: "8px", marginBottom: "24px" }}>
            {error}
            {showMetaMaskLink && (
              <button 
                onClick={openInMetaMask}
                style={{ 
                  marginTop: "12px", 
                  width: "100%", 
                  background: "#f97316",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                Open in MetaMask App
              </button>
            )}
            {showInstallLink && (
              <a 
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: "block",
                  marginTop: "12px", 
                  width: "100%", 
                  background: "#f97316",
                  color: "white",
                  fontWeight: "600",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  textAlign: "center",
                  textDecoration: "none"
                }}
              >
                Install MetaMask Extension
              </a>
            )}
          </div>
        )}

        <div className="grid">
          {/* Step 1: Connect */}
          <div className={`step ${wallet.walletAddress ? "complete" : ""}`}>
            <div className="flex-between">
              <h3>Step 1: Connect Wallet</h3>
              {wallet.walletAddress && <span className="text-success">✓</span>}
            </div>
            {wallet.walletAddress ? (
              <div>
                <p className="text-dim">
                  {walletMode === "embedded" ? "Embedded Wallet" : "MetaMask"}: {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                </p>
                {usdcBalance > 0n && <p className="text-success">Balance: {formatUSDC(usdcBalance)} USDC</p>}
              </div>
            ) : (
              <div className="grid">
                <button onClick={handleConnect} disabled={loading}>
                  {loading ? "Connecting..." : "Connect MetaMask"}
                </button>
                
                <div style={{ textAlign: "center", color: "var(--color-text-dim)", fontSize: "14px" }}>
                  — or —
                </div>
                
                <button 
                  onClick={handleEmbeddedConnect} 
                  disabled={loading}
                  style={{ background: "#10b981" }}
                >
                  Use Embedded Wallet
                </button>
                
                <button 
                  onClick={() => setShowImportForm(!showImportForm)} 
                  disabled={loading}
                  style={{ 
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)"
                  }}
                >
                  {showImportForm ? "Cancel" : "Import Authorized Wallet"}
                </button>
                
                {showImportForm && (
                  <div style={{ 
                    padding: "16px", 
                    background: "var(--color-surface)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)"
                  }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                      Enter deployer mnemonic (12 words):
                    </label>
                    <textarea
                      value={mnemonicInput}
                      onChange={(e) => setMnemonicInput(e.target.value)}
                      placeholder="word1 word2 word3 ... word12"
                      disabled={loading}
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        fontFamily: "monospace",
                        fontSize: "12px"
                      }}
                    />
                    <button 
                      onClick={handleImportMnemonic}
                      disabled={loading}
                      style={{ width: "100%", marginTop: "8px", background: "#6366f1" }}
                    >
                      {loading ? "Importing..." : "Import & Connect"}
                    </button>
                    <p style={{ fontSize: "11px", color: "var(--color-text-dim)", marginTop: "8px" }}>
                      This imports the authorized wallet for NFC payment execution.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Approve */}
          {wallet.walletAddress && (
            <div className={`step ${step === "complete" ? "complete" : ""}`}>
              <div className="flex-between">
                <h3>Step 2: Approve USDC</h3>
                {step !== "connect" && <span className="text-success">✓</span>}
              </div>
              {step === "connect" ? (
                <div>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter USDC amount"
                    min="1"
                    disabled={loading}
                  />
                  <button onClick={handleApprove} disabled={loading || !stakeAmount} style={{ marginTop: "12px", width: "100%" }}>
                    {loading ? "Approving..." : `Approve ${stakeAmount} USDC`}
                  </button>
                </div>
              ) : (
                <p className="text-dim">USDC approved for staking.</p>
              )}
            </div>
          )}

          {/* Step 3: Stake & Open Credit Line */}
          {step === "complete" && wallet.walletAddress && (
            <div className={`step ${credit?.isActive ? "complete" : ""}`}>
              <div className="flex-between">
                <h3>Step 3: Stake & Open Credit Line</h3>
                {credit?.isActive && <span className="text-success">✓</span>}
              </div>
              {!credit?.isActive ? (
                <button onClick={handleStake} disabled={loading}>
                  {loading ? "Staking..." : `Stake ${stakeAmount} USDC & Open Line`}
                </button>
              ) : (
                <p className="text-success">✓ Credit line is active!</p>
              )}
            </div>
          )}

          {/* Credit Summary */}
          {credit?.isActive && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
            >
              <h3>Your Credit Line</h3>
              <div className="grid" style={{ marginTop: "12px", gap: "8px" }}>
                <div className="flex-between">
                  <span className="text-dim">Collateral:</span>
                  <span>{formatUSDC(credit.collateralAmount)} USDC</span>
                </div>
                <div className="flex-between">
                  <span className="text-dim">Credit Limit:</span>
                  <span className="text-success">${formatUSDC(credit.creditLimit)}</span>
                </div>
                <div className="flex-between">
                  <span className="text-dim">Amount Used:</span>
                  <span>{formatUSDC(credit.amountBorrowed)} USDC</span>
                </div>
                <div className="flex-between">
                  <span className="text-dim">Available:</span>
                  <span className="text-success">${formatUSDC(credit.availableCredit)}</span>
                </div>
                <div className="flex-between">
                  <span className="text-dim">Reputation Score:</span>
                  <span>{credit.score.toString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BorrowerDashboard;
