import { useNavigate } from "react-router-dom";
import { useState } from "react";

function LandingPage() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const getIcon = (name: string) => {
    const iconStyle = { width: "48px", height: "48px" };
    switch (name) {
      case "wallet":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="#6366f1" strokeWidth="2"/>
            <path d="M3 10h18M7 15h.01" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "lock":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <rect x="5" y="11" width="14" height="10" rx="2" fill="#6366f1" opacity="0.2"/>
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#6366f1" strokeWidth="2"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "phone":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <rect x="7" y="3" width="10" height="18" rx="2" stroke="#6366f1" strokeWidth="2"/>
            <path d="M11 19h2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "coins":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <circle cx="12" cy="12" r="8" fill="#6366f1" opacity="0.2"/>
            <circle cx="12" cy="12" r="8" stroke="#6366f1" strokeWidth="2"/>
            <path d="M12 8v8M8 12h8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "card":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="#6366f1" strokeWidth="2"/>
            <path d="M2 10h20M6 14h8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "dollar":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="2"/>
            <path d="M12 7v10M15 9h-4a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4H9" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "chart":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <path d="M3 17l6-6 4 4 8-8M17 7h4v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "signal":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <circle cx="12" cy="12" r="2" fill="#6366f1"/>
            <path d="M8.5 8.5a5 5 0 0 1 7 0M5.5 5.5a9 9 0 0 1 13 0" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case "shield":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <path d="M12 3l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V7l8-4z" fill="#6366f1" opacity="0.2"/>
            <path d="M12 3l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V7l8-4z" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        );
      case "globe":
        return (
          <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
            <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="2"/>
            <path d="M3 12h18M12 3c2.5 0 4.5 4 4.5 9s-2 9-4.5 9-4.5-4-4.5-9 2-9 4.5-9z" stroke="#6366f1" strokeWidth="2"/>
          </svg>
        );
      default:
        return <div style={{ ...iconStyle, background: "#e0e7ff", borderRadius: "8px" }} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Hero Section */}
      <section style={{ 
        padding: "80px 20px 80px", 
        textAlign: "center",
        background: "#f9fafb"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ 
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)", 
            fontWeight: "800",
            lineHeight: "1.1",
            marginBottom: "24px",
            color: "#111827"
          }}>
            Crypto Credit Card.<br/>Spend Without Selling.
          </h1>
          <p style={{ 
            fontSize: "1.25rem", 
            color: "#6b7280",
            maxWidth: "900px",
            margin: "0 auto 48px",
            lineHeight: "1.6"
          }}>
            Get instant crypto-backed credit using your USDC. Earn yield on collateral while spending crypto in real life with tap-to-pay technology. No selling required.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => nav("/app")}
              style={{ 
                padding: "16px 48px",
                fontSize: "1.1rem",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "transform 0.2s",
                minWidth: "200px"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Start Borrowing →
            </button>
            <button 
              onClick={() => nav("/app")}
              style={{ 
                padding: "16px 48px",
                fontSize: "1.1rem",
                background: "transparent",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#111827",
                transition: "all 0.2s",
                minWidth: "200px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Start Lending ↗
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: "80px 20px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
              How It Works
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              Get started in minutes with our seamless Web3 credit experience
            </p>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "32px"
          }}>
            {[
              {
                num: "01",
                icon: "wallet",
                title: "Connect Crypto Wallet",
                desc: "Connect your existing Web3 wallet to access crypto credit. Seamless integration with all major wallet providers for instant USDC credit lines."
              },
              {
                num: "02",
                icon: "lock",
                title: "Get Crypto-Backed Credit",
                desc: "Receive instant crypto credit backed by your USDC collateral. No traditional credit checks - just stake crypto for credit."
              },
              {
                num: "03",
                icon: "phone",
                title: "Spend Crypto Everywhere",
                desc: "Use your crypto credit for everyday purchases. Tap-to-pay in stores, online shopping, and real-world payments without selling your crypto."
              },
              {
                num: "04",
                icon: "coins",
                title: "Earn Yield on Collateral",
                desc: "Your staked USDC earns competitive APY while serving as collateral. Self-repaying crypto credit that grows your wealth."
              }
            ].map((step) => (
              <div key={step.num} style={{ 
                padding: "32px",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}>
                <div style={{ 
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "center"
                }}>
                  {getIcon(step.icon)}
                </div>
                <div style={{ 
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6366f1",
                  marginBottom: "8px"
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
                  {step.title}
                </h3>
                <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 20px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
              Why Choose Us?
            </h2>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px"
          }}>
            {[
              {
                icon: "card",
                title: "Crypto Card Technology",
                desc: "Advanced crypto credit card technology built for Web3. Support for all major wallets and real-world payments."
              },
              {
                icon: "dollar",
                title: "USDC Credit Line",
                desc: "Get instant credit backed by your USDC. Stable, reliable crypto collateral for everyday spending."
              },
              {
                icon: "chart",
                title: "Yield-Backed Credit",
                desc: "Your collateral earns yield while providing credit. Turn staked crypto into spending power that pays for itself."
              },
              {
                icon: "signal",
                title: "Tap-to-Pay Crypto",
                desc: "Use crypto for real-world purchases with NFC tap-to-pay technology. Fast, secure, and widely accepted."
              },
              {
                icon: "shield",
                title: "Security & Transparency",
                desc: "Your crypto credit is fully self-custodial and transparent. Avoid capital gains while spending crypto for everyday purchases."
              },
              {
                icon: "globe",
                title: "Non-Custodial Crypto Card",
                desc: "Real-world crypto payments with complete control of your assets. Built on Monad for instant settlement."
              }
            ].map((feature) => (
              <div key={feature.title} style={{ 
                padding: "32px",
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}>
                <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                  {getIcon(feature.icon)}
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
                  {feature.title}
                </h3>
                <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: "80px 20px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
              Why Choose Hexa-cred?
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              Compare our crypto credit system with traditional alternatives
            </p>
          </div>

          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px"
          }}>
            {[
              {
                label: "HEXA-CRED",
                title: "Best Crypto Credit 2026",
                items: [
                  "✓ True crypto credit (no selling)",
                  "✓ Yield-earning USDC collateral",
                  "✓ Non-custodial & self-repaying",
                  "✓ Real-world tap-to-pay",
                  "✓ Avoid capital gains tax"
                ],
                positive: true
              },
              {
                label: "TRADITIONAL",
                title: "Crypto Debit Cards",
                items: [
                  "✗ Requires selling crypto",
                  "✗ No yield on holdings",
                  "✗ Custodial control",
                  "✗ Limited spending options",
                  "✗ Capital gains implications"
                ],
                positive: false
              },
              {
                label: "CEFI",
                title: "Centralized Platforms",
                items: [
                  "! Credit with collateral",
                  "! Custodial risk",
                  "! Centralized control",
                  "! Geographic restrictions",
                  "! Variable APY terms"
                ],
                positive: false
              }
            ].map((card) => (
              <div 
                key={card.label}
                style={{ 
                  padding: "40px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "2px solid #6366f1";
                  e.currentTarget.style.background = "#f0f9ff";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid #e5e7eb";
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ 
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  marginBottom: "12px"
                }}>
                  {card.label}
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "24px", color: "#111827" }}>
                  {card.title}
                </h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {card.items.map((item) => (
                    <li key={item} style={{ 
                      padding: "12px 0",
                      borderBottom: "1px solid #e5e7eb",
                      color: card.positive ? "#111827" : "#6b7280"
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: "80px 20px", background: "#f9fafb" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
              Crypto Credit Card FAQ
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                q: "How does the crypto credit card work?",
                a: "Stake USDC as collateral to unlock instant credit lines. Spend without selling your crypto using NFC tap-to-pay technology. Payments are settled on Monad Testnet with instant finality, and your collateral earns yield while backing your credit."
              },
              {
                q: "Can I spend crypto without selling it?",
                a: "Yes! Your crypto stays in your wallet earning yield. Credit is drawn against your collateral, not sold. This means you avoid capital gains tax and keep your asset exposure while still spending in the real world."
              },
              {
                q: "What makes this the best crypto credit card 2026?",
                a: "Non-custodial design, yield-earning collateral, instant settlement on Monad, NFC tap-to-pay for real-world purchases, and a reputation system that increases your credit limit as you build on-chain history. No traditional credit checks required."
              },
              {
                q: "How do I earn yield on my crypto collateral?",
                a: "Your staked USDC automatically earns competitive APY while serving as collateral. The protocol uses idle collateral productively, creating self-repaying credit that grows your wealth over time."
              },
              {
                q: "Is this better than Nexo or centralized crypto cards?",
                a: "Yes, because you maintain full custody of your assets. Unlike centralized platforms, your crypto never leaves your wallet. You get the benefits of crypto credit with the security of self-custody, plus instant settlement on Monad's high-performance blockchain."
              }
            ].map((faq, idx) => (
              <div key={idx} style={{ 
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{ 
                    width: "100%",
                    padding: "24px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                  color: "#111827",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  {faq.q}
                  <span style={{ fontSize: "1.5rem" }}>
                    {openFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ 
                    padding: "0 24px 24px",
                    color: "#6b7280",
                    lineHeight: "1.6"
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: "80px 20px",
        textAlign: "center",
        background: "#f0f9ff"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "24px", color: "#111827" }}>
            Ready for the best crypto credit card 2026?
          </h2>
          <p style={{ 
            fontSize: "1.25rem",
            color: "#6b7280",
            marginBottom: "40px"
          }}>
            Experience crypto credit without selling your assets. Start spending crypto in stores with our stablecoin credit card.
          </p>
          <button 
            onClick={() => nav("/app")}
            style={{ 
              padding: "16px 48px",
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "transform 0.2s",
              minWidth: "200px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Start Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: "60px 20px 40px",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "40px",
            marginBottom: "40px"
          }}>
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
                Hexa-cred
              </h3>
              <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                The best crypto credit card 2026. Spend crypto without selling with yield-earning USDC collateral.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: "600", marginBottom: "16px", color: "#111827" }}>Quick Links</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <a onClick={() => nav("/app")} style={{ 
                  color: "#6b7280",
                  cursor: "pointer",
                  textDecoration: "none"
                }}>
                  Get Crypto Credit
                </a>
                <a onClick={() => nav("/app")} style={{ 
                  color: "#6b7280",
                  cursor: "pointer",
                  textDecoration: "none"
                }}>
                  Stake USDC & Earn
                </a>
                <a onClick={() => nav("/pay")} style={{ 
                  color: "#6b7280",
                  cursor: "pointer",
                  textDecoration: "none"
                }}>
                  Payment Terminal
                </a>
              </div>
            </div>
          </div>
          <div style={{ 
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "0.875rem"
          }}>
            © 2026 Hexa-cred. Built on Monad Testnet. The future of crypto credit cards.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
