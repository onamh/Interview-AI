import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile, changeUserPassword, getCandidateStats } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  User,
  Mail,
  Lock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || "English");
  const [targetRole, setTargetRole] = useState(user?.target_role || "Full Stack Developer");

  const [stats, setStats] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [res, statsRes] = await Promise.all([
          getUserProfile().catch(() => null),
          getCandidateStats().catch(() => null),
        ]);
        if (res && res.user) {
          setName(res.user.name || "");
          setPreferredLanguage(res.user.preferred_language || "English");
          setTargetRole(res.user.target_role || "");
        }
        if (statsRes) {
          setStats(statsRes);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setSavingProfile(true);

    try {
      const res = await updateUserProfile({
        name,
        preferred_language: preferredLanguage,
        target_role: targetRole,
      });
      if (res.user) {
        updateUser(res.user);
        setProfileSuccess("Profile updated successfully!");
      }
    } catch (err) {
      setProfileError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
            Account Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
            My Account & Profile
          </h1>
          <p className="text-xs text-[#57534e]">
            Manage your personal profile, target career track, and credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Profile Form (7 Cols) */}
          <div className="md:col-span-7 bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f0ece3]">
              <User className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                Personal Information
              </h2>
            </div>

            {profileSuccess && (
              <div className="p-3 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2 text-sm bg-[#ede8df] border border-[#e8e4dc] rounded-xl text-[#78716c] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Developer, Python Engineer"
                  className="w-full px-3.5 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {savingProfile ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </form>
          </div>

          {/* Right Column: Account Summary & Password (5 Cols) */}
          <div className="md:col-span-5 space-y-6">
            {/* Account Summary Card */}
            <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                Candidate Overview
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f0ece3]">
                  <span className="text-[#78716c]">Candidate Name:</span>
                  <span className="font-semibold text-[#171717]">{user?.name || "Candidate"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0ece3]">
                  <span className="text-[#78716c]">Target Track:</span>
                  <span className="font-semibold text-[#171717]">{targetRole || "Engineering"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0ece3]">
                  <span className="text-[#78716c]">Interviews Completed:</span>
                  <span className="font-semibold text-[#171717]">{stats?.total_interviews ?? 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#78716c]">Average Score:</span>
                  <span className="font-semibold text-[#171717]">{stats?.average_score ? `${stats.average_score}%` : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
                <Lock className="w-4 h-4 text-[#171717]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Change Password
                </h3>
              </div>

              {passwordSuccess && (
                <div className="p-2.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-2.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#44403c] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403c] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-1.5 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#44403c] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
