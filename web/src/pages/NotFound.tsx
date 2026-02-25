import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      background: "#f9fafb"
    }}>
      <div style={{
        maxWidth: "600px",
        padding: "60px 40px",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "120px",
          fontWeight: "800",
          lineHeight: "1",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "24px"
        }}>
          404
        </div>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "700",
          marginBottom: "16px",
          color: "#111827"
        }}>
          Page Not Found
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#6b7280",
          marginBottom: "40px",
          lineHeight: "1.6"
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "14px 32px",
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
            Go Home
          </button>
          <button
            onClick={() => navigate("/app")}
            style={{
              padding: "14px 32px",
              fontSize: "16px",
              background: "transparent",
              color: "#6366f1",
              border: "2px solid #6366f1",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#6366f1";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6366f1";
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
