import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    demoLogin,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authModalMode === "register") {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError("Demo login failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={closeAuthModal}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close-btn" onClick={closeAuthModal}>
          ✕
        </button>

        <div className="auth-header">
          <h2>
            {authModalMode === "register" ? "Create Candidate Account" : "Candidate Sign In"}
          </h2>
          <p>
            {authModalMode === "register"
              ? "Track your mock interviews, placement scores, and strengths"
              : "Access your interview history, stats, and personalized coaching"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authModalMode === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthModalMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${authModalMode === "register" ? "active" : ""}`}
            onClick={() => {
              setAuthModalMode("register");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {authModalMode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="candidate@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Authenticating..."
              : authModalMode === "register"
              ? "Register & Start"
              : "Sign In"}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR QUICK DEMO</span>
        </div>

        <button
          type="button"
          className="auth-demo-btn"
          onClick={handleDemo}
          disabled={loading}
        >
          ⚡ Instant Demo Sign In (Aarav Sharma)
        </button>

        <p className="auth-footer-text">
          {authModalMode === "register" ? (
            <>
              Already registered?{" "}
              <span onClick={() => setAuthModalMode("login")}>Sign in here</span>
            </>
          ) : (
            <>
              New candidate?{" "}
              <span onClick={() => setAuthModalMode("register")}>Create free account</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
