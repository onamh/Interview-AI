import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e8e4dc] rounded-2xl p-8 max-w-md w-full shadow-2xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#171717] text-white flex items-center justify-center mx-auto shadow-xs font-bold text-xs">
            AI
          </div>
          <h1 className="text-2xl font-bold text-[#171717] tracking-tight">
            Sign In to Interview AI
          </h1>
          <p className="text-xs text-[#57534e]">
            Access your personalized candidate dashboard and past mock evaluations.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 text-[#57534e] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#171717]"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-[#78716c]">
          Don't have an account yet?{" "}
          <Link to="/signup" className="font-semibold text-[#171717] hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
