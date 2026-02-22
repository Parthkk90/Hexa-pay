import { useState, useEffect } from "react";
import { BrowserProvider, Wallet, HDNodeWallet } from "ethers";
import { useWallet } from "../state/useWallet";
import { connectWallet, getProvider } from "../lib/wallet";
import { getCreditReadOnly, getCreditManagerWithWallet } from "../lib/contracts";
import { getEmbeddedWallet, getEmbeddedWalletBalance, importWalletFromMnemonic } from "../lib/embeddedWallet";
import { toUSDC } from "../utils/usdcUtils";
import { MONAD_TESTNET } from "../config/chains";
 
type PaymentStatus = "idle" | "waiting" | "processing" | "success" | "error";
type WalletMode = "none" | "metamask" | "embedded";
type DeviceMode = "desktop" | "phone";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function MerchantTerminal() {
  const wallet = useWallet();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [embeddedWallet, setEmbeddedWallet] = useState<Wallet | HDNodeWallet | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode>("none");
  const [embeddedBalance, setEmbeddedBalance] = useState("0");
  const [merchantName, setMerchantName] = useState("Coffee Shop");
  const [amount, setAmount] = useState("12.50");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [lastTxHash, setLastTxHash] = useState("");
  const [error, setError] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode | null>(null);
  const [lastTapId, setLastTapId] = useState<number | null>(null);

  useEffect(() => {
    if (wallet.walletAddress) {
      getProvider().then(setProvider);
      setWalletMode("metamask");
    }
  }, [wallet.walletAddress]);

  // Desktop mode: Poll for NFC taps from API
  useEffect(() => {
    if (deviceMode !== "desktop" || status !== "waiting") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/tap/latest`);
        const data = await response.json();
        
        if (data.tap && data.tap.id !== lastTapId) {
          console.log("💻 Desktop received tap:", data.tap);
          setLastTapId(data.tap.id);
          // Execute payment with the tapped card ID
          executePayment(data.tap.cardId);
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    }, 1000); // Poll every 1 second

    return () => clearInterval(pollInterval);
  }, [deviceMode, status, lastTapId]);

  // Connect with MetaMask
  const handleConnect = async () => {
    try {
      setError("");
      const address = await connectWallet();
      wallet.setWalletAddress(address);
      const p = await getProvider();
      setProvider(p);
      setWalletMode("metamask");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect";
      setError(errorMsg);
    }
  };

  // Connect with embedded wallet (for Chrome NFC)
  const handleEmbeddedConnect = async () => {
    try {
      setError("");
      const ew = getEmbeddedWallet();
      setEmbeddedWallet(ew);
      wallet.setWalletAddress(ew.address);
      setWalletMode("embedded");
      
      // Get balance
      const balance = await getEmbeddedWalletBalance();
      setEmbeddedBalance(balance);
      
      if (parseFloat(balance) < 0.001) {
        setError(`Embedded wallet needs gas. Send MON to: ${ew.address}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    }
  };

  // Import authorized wallet from mnemonic
  const handleImportMnemonic = async () => {
    try {
      setError("");
      if (!mnemonicInput.trim()) {
        setError("Enter mnemonic phrase");
        return;
      }
      
      const ew = importWalletFromMnemonic(mnemonicInput.trim());
      setEmbeddedWallet(ew);
      wallet.setWalletAddress(ew.address);
      setWalletMode("embedded");
      setShowImportForm(false);
      setMnemonicInput("");
      
      const balance = await getEmbeddedWalletBalance();
      setEmbeddedBalance(balance);
      
      if (parseFloat(balance) < 0.001) {
        setError(`Wallet needs gas. Send MON to: ${ew.address}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid mnemonic");
    }
  };

  const executePayment = async (borrowerAddress?: string) => {
    // Check we have a wallet connected (either mode)
    if (walletMode === "none") {
      setError("Connect wallet first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter valid amount");
      return;
    }

    const targetAddress = borrowerAddress || wallet.walletAddress;
    if (!targetAddress) {
      setError("No borrower address provided");
      return;
    }

    try {
      setStatus("processing");
      setError("");

      // Check if borrower has active credit line (read-only, no wallet needed)
      const creditData = await getCreditReadOnly(targetAddress);
      if (!creditData.isActive) {
        setError(`No active credit line for ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`);
        setStatus("error");
        return;
      }

      const amountWei = toUSDC(Number(amount));

      // Check available credit
      const availableCredit = creditData.creditLimit - creditData.amountBorrowed;
      if (amountWei > availableCredit) {
        setError(`Insufficient credit. Available: $${Number(availableCredit) / 1e6}`);
        setStatus("error");
        return;
      }

      let tx;
      
      if (walletMode === "embedded" && embeddedWallet) {
        // Use embedded wallet
        const creditManager = getCreditManagerWithWallet(embeddedWallet);
        tx = await creditManager.executePayment(targetAddress, amountWei);
      } else if (provider) {
        // Use MetaMask
        const signer = await provider.getSigner();
        const creditManager = getCreditManagerWithWallet(signer);
        tx = await creditManager.executePayment(targetAddress, amountWei);
      } else {
        setError("No wallet available");
        setStatus("error");
        return;
      }

      const receipt = await tx.wait();

      setLastTxHash(receipt?.hash ?? tx.hash);
      setStatus("success");

      setTimeout(async () => {
        try {
          await getCreditReadOnly(targetAddress);
        } catch {
          // Polling error is non-critical
        }
      }, 2000);
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const startNfcScan = async () => {
    // Phone mode: Only needs NFC, no wallet
    if (deviceMode === "phone") {
      if (!("NDEFReader" in window)) {
        setError("Web NFC not supported. Use Chrome on Android for NFC payments.");
        return;
      }

      try {
        setStatus("waiting");
        setError("");

        const ndef = new (window as any).NDEFReader();
        
        ndef.onreading = async (event: any) => {
          console.log("📱 Phone: NFC tag detected!", event);
          
          let borrowerAddress = "";
          
          for (const record of event.message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder();
              const text = textDecoder.decode(record.data);
              
              if (text.startsWith("0x") && text.length === 42) {
                borrowerAddress = text;
                break;
              }
              if (text.length === 40 && /^[0-9a-fA-F]+$/.test(text)) {
                borrowerAddress = "0x" + text;
                break;
              }
            }
          }

          if (!borrowerAddress) {
            setError("No valid wallet address found on NFC card.");
            setStatus("error");
            return;
          }

          // Send to API
          try {
            setStatus("processing");
            const response = await fetch(`${API_URL}/api/tap`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cardId: borrowerAddress,
                timestamp: Date.now()
              })
            });
            
            const data = await response.json();
            console.log("📱 Phone: Tap sent to desktop!", data);
            setStatus("success");
            setLastTxHash("Sent to desktop");
            
            // Reset after 2 seconds
            setTimeout(() => {
              setStatus("idle");
              setLastTxHash("");
            }, 2000);
          } catch (err) {
            setError("Failed to send tap to desktop");
            setStatus("error");
          }
        };

        await ndef.scan();
        console.log("📱 Phone: NFC scanning started...");
      } catch (err: any) {
        setStatus("idle");
        console.error("NFC scan error:", err);
        
        if (err.name === "NotAllowedError") {
          setError("NFC permission denied. Enable NFC in your browser settings.");
        } else {
          setError(err.message || "NFC scan failed.");
        }
      }
      return;
    }

    // Desktop mode: Needs wallet
    if (!provider && walletMode !== "embedded") {
      setError("Connect wallet first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter valid amount");
      return;
    }

    // Desktop just waits for polling to trigger payment
    setStatus("waiting");
    setError("");
    console.log("💻 Desktop: Waiting for phone to send NFC tap...");
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "waiting":
        return <span className="status-badge status-waiting">Waiting for tap...</span>;
      case "processing":
        return <span className="status-badge status-processing">Processing...</span>;
      case "success":
        return <span className="status-badge status-success">Approved ✓</span>;
      case "error":
        return <span className="status-badge status-error">Payment Failed</span>;
      default:
        return <span className="status-badge status-waiting">Ready</span>;
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `${MONAD_TESTNET.explorer}/tx/${txHash}`;
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Payment Terminal</h1>
          <p className="text-dim">Accept crypto payments with NFC tap-to-pay</p>
        </div>

        {/* Device Mode Selection */}
        {!deviceMode ? (
          <div className="grid">
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Choose Device Mode</h3>
              <p className="text-dim" style={{ fontSize: "14px" }}>
                For best demo: Desktop processes payments, Phone reads NFC
              </p>
            </div>
            
            <button 
              onClick={() => setDeviceMode("desktop")}
              style={{ 
                width: "100%",
                padding: "20px",
                background: "#6366f1",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "24px" }}>💻</span>
              <span style={{ fontSize: "16px", fontWeight: "600" }}>Desktop Mode</span>
              <span style={{ fontSize: "12px", opacity: 0.9 }}>
                Connect MetaMask • Execute Payments
              </span>
            </button>
            
            <button 
              onClick={() => setDeviceMode("phone")}
              style={{ 
                width: "100%",
                padding: "20px",
                background: "#10b981",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "24px" }}>📱</span>
              <span style={{ fontSize: "16px", fontWeight: "600" }}>Phone Mode</span>
              <span style={{ fontSize: "12px", opacity: 0.9 }}>
                Read NFC Cards • Send to Desktop
              </span>
            </button>
            
            <div style={{ 
              background: "var(--color-surface)", 
              padding: "12px", 
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--color-text-dim)"
            }}>
              <strong>Setup:</strong> Open desktop mode on laptop, phone mode on Android Chrome. Phone reads card → Desktop processes payment.
            </div>
          </div>
        ) : deviceMode === "phone" ? (
          // Phone Mode UI
          <div className="grid">
            <div style={{ 
              background: "#10b981", 
              color: "white", 
              padding: "12px", 
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "8px"
            }}>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>📱</div>
              <div style={{ fontWeight: "600" }}>Phone Mode - NFC Reader</div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>Sends taps to desktop</div>
            </div>
            
            <button 
              onClick={() => setDeviceMode(null)}
              style={{ 
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)"
              }}
            >
              ← Change Mode
            </button>

            <div className="grid">
              <button 
                onClick={startNfcScan}
                disabled={status === "waiting" || status === "processing"}
                style={{
                  width: "100%",
                  padding: "24px",
                  fontSize: "18px",
                  background: status === "waiting" ? "#fbbf24" : "#10b981"
                }}
              >
                {status === "idle" && "🔍 Start NFC Scanning"}
                {status === "waiting" && "👋 Tap Card Now..."}
                {status === "processing" && "📤 Sending to Desktop..."}
                {status === "success" && "✓ Sent!"}
                {status === "error" && "❌ Error"}
              </button>
              
              {status === "waiting" && (
                <p style={{ textAlign: "center", color: "#fbbf24", fontSize: "14px" }}>
                  Hold your NFC card near the phone
                </p>
              )}
              
              {error && (
                <div className="error-box">{error}</div>
              )}
              
              {lastTxHash && lastTxHash !== "Sent to desktop" && (
                <div style={{ 
                  padding: "12px", 
                  background: "var(--color-surface)", 
                  borderRadius: "8px",
                  fontSize: "13px",
                  wordBreak: "break-all"
                }}>
                  <strong>Status:</strong> {lastTxHash}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop Mode UI
          <>
            <div style={{ 
              background: "#6366f1", 
              color: "white", 
              padding: "12px", 
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>💻</div>
              <div style={{ fontWeight: "600" }}>Desktop Mode - Payment Processor</div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>Executes payments via MetaMask</div>
            </div>
            
            <button 
              onClick={() => setDeviceMode(null)}
              style={{ 
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                marginBottom: "16px"
              }}
            >
              ← Change Mode
            </button>

            {walletMode === "none" ? (
              <div className="grid">
                <button onClick={handleConnect} style={{ width: "100%" }}>
                  Connect MetaMask
                </button>
                
                <div style={{ textAlign: "center", color: "var(--color-text-dim)", fontSize: "14px" }}>
                  — or use Chrome with NFC —
                </div>
                
                <button 
                  onClick={handleEmbeddedConnect} 
                  style={{ 
                    width: "100%", 
                    background: "#10b981",
                  }}
                >
                  Use Embedded Wallet (NFC Ready)
                </button>
                
                <button 
                  onClick={() => setShowImportForm(!showImportForm)} 
                  style={{ 
                    width: "100%", 
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
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        fontFamily: "monospace",
                        fontSize: "12px"
                      }}
                    />
                    <button 
                      onClick={handleImportMnemonic}
                      style={{ width: "100%", marginTop: "8px", background: "#6366f1" }}
                    >
                      Import & Connect
                    </button>
                    <p style={{ fontSize: "11px", color: "var(--color-text-dim)", marginTop: "8px" }}>
                      Use the deployer wallet mnemonic from contracts/.env to enable payment execution.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Desktop wallet connected - show payment form
              <div className="grid">
                {/* Wallet Info */}
                <div style={{ 
                  background: "var(--color-surface)", 
                  padding: "12px", 
                  borderRadius: "8px",
                  fontSize: "14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-dim">
                      {walletMode === "embedded" ? "Embedded Wallet" : "MetaMask"}
                    </span>
                    <span style={{ fontFamily: "monospace" }}>
                      {wallet.walletAddress?.slice(0, 6)}...{wallet.walletAddress?.slice(-4)}
                    </span>
                  </div>
                  {walletMode === "embedded" && (
                    <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                      <span className="text-dim">Gas Balance:</span>
                      <span style={{ color: parseFloat(embeddedBalance) < 0.001 ? "#ef4444" : "#10b981" }}>
                        {parseFloat(embeddedBalance).toFixed(4)} MON
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--color-text-dim)" }}>
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Shop name"
                    disabled={status === "processing" || status === "waiting"}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--color-text-dim)" }}>
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={status === "processing" || status === "waiting"}
                  />
                </div>

                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ marginBottom: "16px" }}>
                    {getStatusDisplay()}
                  </div>

                  {status === "idle" || status === "error" ? (
                    <>
                      <button
                        onClick={startNfcScan}
                        disabled={!wallet.walletAddress || !amount || Number(amount) <= 0}
                        style={{ width: "100%", padding: "16px", fontSize: "16px" }}
                      >
                        💻 Start Waiting for Phone Tap
                      </button>
                      <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--color-text-dim)" }}>
                        Desktop will auto-pay when phone reads NFC card
                      </p>
                    </>
                  ) : status === "success" ? (
                    <button onClick={() => setStatus("idle")} style={{ width: "100%" }}>
                      New Transaction
                    </button>
                  ) : null}
                </div>

                {lastTxHash && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <p style={{ marginBottom: "8px", fontSize: "12px", color: "var(--color-text-dim)" }}>
                      Transaction Hash
                    </p>
                    <p style={{ fontSize: "14px", wordBreak: "break-all", marginBottom: "8px" }}>
                      <code>{lastTxHash}</code>
                    </p>
                    <a
                      href={getExplorerUrl(lastTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "12px" }}
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      padding: "12px",
                      borderRadius: "6px"
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MerchantTerminal;
