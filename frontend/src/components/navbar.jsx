import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout, openAuthModal, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDemoClick = async () => {
    try {
      await demoLogin();
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="main-navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="brand-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">InterviewAI Coach</span>
            <span className="brand-badge">Placement Pro</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/setup"
            className={`nav-link ${isActive("/setup") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Mock Interview
          </Link>
          <Link
            to="/dashboard#recent"
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            Past Reports
          </Link>
        </nav>

        {/* Right Action / Profile */}
        <div className="nav-actions">
          {user ? (
            <div className="user-profile">
              <div className="user-avatar" title={user.name}>
                {getInitials(user.name)}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">Candidate</span>
              </div>
              <button
                className="btn-logout"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                title="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="btn-demo-quick"
                onClick={handleDemoClick}
                title="Try instant demo account without registration"
              >
                ⚡ 1-Click Demo
              </button>
              <button
                className="btn-login-trigger"
                onClick={() => openAuthModal("login")}
              >
                Sign In
              </button>
              <button
                className="btn-register-trigger"
                onClick={() => openAuthModal("register")}
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
