import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ProofDrawer } from "./components/layout/ProofDrawer";
import { TxStepperToast } from "./components/ui/TxStepperToast";
import { ConnectWalletModal } from "./components/ui/ConnectWalletModal";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { CataloguePage } from "./pages/CataloguePage";
import { MemberDashboardPage } from "./pages/MemberDashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A]">
          {/* Top Navigation */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/dashboard" element={<MemberDashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>

          {/* University Institutional Footer */}
          <Footer />

          {/* Verification Proof Drawer */}
          <ProofDrawer />

          {/* Live Blockchain Transaction Stepper Toast */}
          <TxStepperToast />

          {/* Connect Wallet & Profile Selection Modal */}
          <ConnectWalletModal />
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}
