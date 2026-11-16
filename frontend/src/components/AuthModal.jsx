import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, X, AlertCircle, Eye, EyeOff } from "lucide-react";

function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (authModalMode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      if (authModalMode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Authentication failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div
        className="bg-white border border-[#e8e4dc] rounded-2xl shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-[#a8a29e] hover:text-[#171717] rounded-full hover:bg-[#f7f5f0] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#171717] tracking-tight">
            {authModalMode === "register" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-[#57534e] mt-0.5">
            {authModalMode === "register"
              ? "Register to save your mock interview practice history and evaluations."
              : "Sign in to access your candidate dashboard and past evaluation reports."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f7f5f0] border border-[#e8e4dc] p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              authModalMode === "login"
                ? "bg-white text-[#171717] shadow-2xs"
                : "text-[#78716c] hover:text-[#171717]"
            }`}
            onClick={() => {
              setAuthModalMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              authModalMode === "register"
                ? "bg-white text-[#171717] shadow-2xs"
                : "text-[#78716c] hover:text-[#171717]"
            }`}
            onClick={() => {
              setAuthModalMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-[#44403c] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#44403c]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-9 pr-9 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#a8a29e] hover:text-[#57534e]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authModalMode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-[#44403c] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? "Processing..." : authModalMode === "register" ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
