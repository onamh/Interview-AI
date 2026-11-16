import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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

    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
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
            Create Account
          </h1>
          <p className="text-xs text-[#57534e]">
            Join Interview AI to practice mock interviews and track evaluations.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#78716c]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#171717] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
