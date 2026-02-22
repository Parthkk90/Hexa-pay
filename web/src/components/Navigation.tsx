import { useNavigate, useLocation } from "react-router-dom";

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#111827",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onClick={() => navigate("/")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#6366f1" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Hexa-cred
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: isActive("/") ? "#6366f1" : "transparent",
            border: isActive("/") ? "none" : "1px solid #e5e7eb",
            padding: "8px 16px",
            fontSize: "14px",
            color: isActive("/") ? "#ffffff" : "#111827",
            fontWeight: "500"
          }}
        >
          Home
        </button>
        <button
          onClick={() => navigate("/app")}
          style={{
            background: isActive("/app") ? "#6366f1" : "transparent",
            border: isActive("/app") ? "none" : "1px solid #e5e7eb",
            padding: "8px 16px",
            fontSize: "14px",
            color: isActive("/app") ? "#ffffff" : "#111827",
            fontWeight: "500"
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate("/pay")}
          style={{
            background: isActive("/pay") ? "#6366f1" : "transparent",
            border: isActive("/pay") ? "none" : "1px solid #e5e7eb",
            padding: "8px 16px",
            fontSize: "14px",
            color: isActive("/pay") ? "#ffffff" : "#111827",
            fontWeight: "500"
          }}
        >
          Payment Terminal
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
