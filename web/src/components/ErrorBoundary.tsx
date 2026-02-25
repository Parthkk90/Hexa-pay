import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#f9fafb"
        }}>
          <div style={{
            maxWidth: "600px",
            padding: "40px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 24px" }}>
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px", color: "#111827" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
              We encountered an unexpected error. Please refresh the page or try again later.
            </p>
            {this.state.error && (
              <details style={{ 
                marginBottom: "24px",
                padding: "16px",
                background: "#f3f4f6",
                borderRadius: "8px",
                textAlign: "left",
                fontSize: "14px",
                fontFamily: "monospace"
              }}>
                <summary style={{ cursor: "pointer", fontWeight: "600", marginBottom: "8px" }}>
                  Error Details
                </summary>
                <code style={{ display: "block", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {this.state.error.toString()}
                </code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 32px",
                fontSize: "16px",
                background: "#6366f1",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4f46e5"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#6366f1"}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
