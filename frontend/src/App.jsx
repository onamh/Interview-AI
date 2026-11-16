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
import History from "./pages/History";
import Resumes from "./pages/Resumes";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#f7f5f0] text-[#171717]">
          <Navbar />
          <AuthModal />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/setup" element={<InterviewSetup />} />
              <Route path="/interview/:sessionId" element={<Interview />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/history" element={<History />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
