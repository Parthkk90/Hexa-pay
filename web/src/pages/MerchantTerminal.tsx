import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { useWallet } from "../state/useWallet";
import { connectWallet, getProvider, openInMetaMask } from "../lib/wallet";
import { getCredit, getCreditManager } from "../lib/contracts";
import { toUSDC } from "../utils/usdcUtils";
import { MONAD_TESTNET } from "../config/chains";
 
type PaymentStatus = "idle" | "waiting" | "processing" | "success" | "error";

function MerchantTerminal() {
  const wallet = useWallet();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [merchantName, setMerchantName] = useState("Coffee Shop");
  const [amount, setAmount] = useState("12.50");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [lastTxHash, setLastTxHash] = useState("");
  const [error, setError] = useState("");
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcPermission, setNfcPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (wallet.walletAddress) {
      getProvider().then(setProvider);
    }

    // Check NFC support
    const hasNFC = "NDEFReader" in window;
    setNfcSupported(hasNFC);

    // Detect Android device
    const userAgent = navigator.userAgent.toLowerCase();
    const androidDevice = userAgent.includes("android");
    setIsAndroid(androidDevice);

    // Check NFC permission
    if (hasNFC && androidDevice) {
      checkNfcPermission();
    }
  }, [wallet.walletAddress]);

  const checkNfcPermission = async () => {
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      setNfcPermission("granted");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setNfcPermission("denied");
      }
    }
  };

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [showMetaMaskLink, setShowMetaMaskLink] = useState(false);
  const [showInstallLink, setShowInstallLink] = useState(false);

  const handleConnect = async () => {
    try {
      setError("");
      setShowMetaMaskLink(false);
      setShowInstallLink(false);
      const address = await connectWallet();
      wallet.setWalletAddress(address);
      const p = await getProvider();
      setProvider(p);
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
    }
  };

  const executePayment = async (borrowerAddress?: string) => {
    if (!provider) {
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

      // Check if borrower has active credit line
      const creditData = await getCredit(provider, targetAddress);
      if (!creditData.isActive) {
        setError(`No active credit line for ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`);
        setStatus("error");
        return;
      }

      const creditManager = await getCreditManager(provider);
      const amountWei = toUSDC(Number(amount));

      // Check available credit
      const availableCredit = creditData.creditLimit - creditData.amountBorrowed;
      if (amountWei > availableCredit) {
        setError(`Insufficient credit. Available: $${Number(availableCredit) / 1e6}`);
        setStatus("error");
        return;
      }

      const tx = await creditManager.executePayment(targetAddress, amountWei);
      const receipt = await tx.wait();

      setLastTxHash(receipt?.hash ?? tx.hash);
      setStatus("success");

      setTimeout(async () => {
        try {
          await getCredit(provider, targetAddress);
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
    if (!provider) {
      setError("Connect wallet first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter valid amount");
      return;
    }

    if (!("NDEFReader" in window)) {
      setError("Web NFC not supported. Use Chrome on Android for NFC payments.");
      return;
    }

    try {
      setStatus("waiting");
      setError("");

      const ndef = new (window as any).NDEFReader();
      
      // Set up the reading handler BEFORE starting scan
      ndef.onreading = async (event: any) => {
        console.log("NFC tag detected!", event);
        
        // Read wallet address from NFC card
        let borrowerAddress = "";
        
        for (const record of event.message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            console.log("NFC text content:", text);
            
            // Check if it's a valid Ethereum address
            if (text.startsWith("0x") && text.length === 42) {
              borrowerAddress = text;
              break;
            }
            // Also check for address without 0x prefix
            if (text.length === 40 && /^[0-9a-fA-F]+$/.test(text)) {
              borrowerAddress = "0x" + text;
              break;
            }
          }
        }

        if (!borrowerAddress) {
          setError("No valid wallet address found on NFC card. Please write an Ethereum address to the card.");
          setStatus("error");
          return;
        }

        console.log("Borrower address from NFC:", borrowerAddress);
        // Execute payment using the address from the NFC card
        await executePayment(borrowerAddress);
      };

      ndef.onreadingerror = (event: any) => {
        console.error("NFC read error:", event);
        setStatus("error");
        setError("NFC read error. Try again.");
      };

      // Request permission and start scanning
      await ndef.scan();
      console.log("NFC scanning started. Waiting for tap...");
      setNfcPermission("granted");
      
    } catch (err: any) {
      setStatus("idle");
      console.error("NFC scan error:", err);
      
      if (err.name === "NotAllowedError") {
        setNfcPermission("denied");
        setError("NFC permission denied. Enable NFC in your browser settings.");
      } else if (err.name === "NotSupportedError") {
        setError("NFC not supported on this device.");
      } else if (err.name === "InvalidStateError") {
        setError("NFC already scanning. Tap your card now.");
        setStatus("waiting");
      } else {
        setError(err.message || "NFC scan failed. Make sure NFC is enabled on your device.");
      }
    }
  };

  // Hidden fallback trigger
  const handleStatusClick = () => {
    if (status === "waiting") {
      executePayment();
    }
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

        {!wallet.walletAddress ? (
          <button onClick={handleConnect} style={{ width: "100%" }}>
            Connect Wallet
          </button>
        ) : (
          <div className="grid">
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
              <div
                onClick={handleStatusClick}
                style={{
                  cursor: status === "waiting" ? "pointer" : "default",
                  marginBottom: "16px",
                  padding: status === "waiting" ? "8px" : "0",
                  background: status === "waiting" && !isAndroid ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  borderRadius: "8px",
                  border: status === "waiting" && !isAndroid ? "2px dashed var(--color-primary)" : "none",
                }}
                title={status === "waiting" && !isAndroid ? "Click here to simulate NFC tap" : ""}
              >
                {getStatusDisplay()}
              </div>

              {status === "idle" || status === "error" ? (
                <>
                  <button
                    onClick={startNfcScan}
                    disabled={!wallet.walletAddress || !amount || Number(amount) <= 0}
                    style={{ width: "100%" }}
                  >
                    {nfcSupported && isAndroid ? "Start NFC Scan" : "Process Payment"}
                  </button>
                  {!isAndroid && (
                    <p style={{ marginTop: "8px", fontSize: "11px", color: "var(--color-text-dim)" }}>
                      Desktop mode: Will show waiting status, click to complete
                    </p>
                  )}
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
          </div>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "12px" }}>
          {nfcSupported && isAndroid ? (
            <div>
              <p style={{ color: "var(--color-success)", marginBottom: "8px" }}>
                ✓ Web NFC Ready on Android Chrome
              </p>
              {nfcPermission === "denied" && (
                <p style={{ color: "var(--color-error)" }}>
                  ! NFC permission denied. Enable in Settings → Site Settings → NFC
                </p>
              )}
              <p style={{ color: "var(--color-text-dim)", marginTop: "8px" }}>
                Tap "Start NFC Scan" then hold your NFC card to the back of your phone
              </p>
            </div>
          ) : nfcSupported && !isAndroid ? (
            <div>
              <p style={{ color: "var(--color-text-dim)", marginBottom: "8px" }}>
                ! NFC requires Android Chrome
              </p>
              <p style={{ color: "var(--color-text-dim)" }}>
                Desktop: Click status text during "Waiting" to trigger fallback payment
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--color-text-dim)", marginBottom: "8px" }}>
                NFC not supported — using fallback mode
              </p>
              <p style={{ color: "var(--color-text-dim)" }}>
                To test NFC: Use Chrome on Android and access via port forwarding
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MerchantTerminal;
