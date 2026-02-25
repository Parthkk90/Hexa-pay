import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import MerchantTerminal from "./pages/MerchantTerminal";
import NotFound from "./pages/NotFound";

function AppContent() {
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: "80px" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<BorrowerDashboard />} />
          <Route path="/pay" element={<MerchantTerminal />} />
          <Route path="/merchant" element={<MerchantTerminal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
