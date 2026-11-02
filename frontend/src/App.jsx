import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/navbar";
import AuthModal from "./components/AuthModal";

import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import InterviewSetup from "./pages/interviewsetup";
import Interview from "./pages/interview";
import Evaluation from "./pages/evaluation";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <AuthModal />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/setup" element={<InterviewSetup />} />
              <Route path="/interview/:sessionId" element={<Interview />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
