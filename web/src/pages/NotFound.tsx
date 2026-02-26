import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 80px)",
        padding: "20px",
        textAlign: "center",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "60px 40px",
          maxWidth: "600px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "120px",
            fontWeight: "800",
            color: "#6366f1",
            lineHeight: "1",
            marginBottom: "16px",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: "18px",
            marginBottom: "32px",
            lineHeight: "1.6",
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              background: "#6366f1",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Go to Homepage
          </button>
          <button
            onClick={() => navigate("/app")}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              background: "transparent",
              color: "#6366f1",
              border: "2px solid #6366f1",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s",
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
