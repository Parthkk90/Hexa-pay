import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { useWallet } from "../state/useWallet";
import { connectWallet, getProvider, openInMetaMask } from "../lib/wallet";
import { getCredit, getUsdc, getCreditManager, type CreditSnapshot } from "../lib/contracts";
import { toUSDC, formatUSDC } from "../utils/usdcUtils";
import { CREDIT_MANAGER_ADDRESS } from "../config/contracts";

type Step = "connect" | "approve" | "complete";

function BorrowerDashboard() {
  const wallet = useWallet();
  const [step, setStep] = useState<Step>("connect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [usdcBalance, setUsdcBalance] = useState(0n);
  const [credit, setCredit] = useState<CreditSnapshot | null>(null);
  const [stakeAmount, setStakeAmount] = useState("100");

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
                <p className="text-dim">Connected: {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}</p>
                {usdcBalance > 0n && <p className="text-success">Balance: {formatUSDC(usdcBalance)} USDC</p>}
              </div>
            ) : (
              <button onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting..." : "Connect MetaMask"}
              </button>
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
