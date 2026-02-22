import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import LandingPage from "./pages/LandingPage";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import MerchantTerminal from "./pages/MerchantTerminal";

function AppContent() {
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: "80px" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<BorrowerDashboard />} />
          <Route path="/pay" element={<MerchantTerminal />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
