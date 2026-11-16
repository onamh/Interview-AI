import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Practice", path: "/setup" },
    { label: "Dashboard", path: "/dashboard", authOnly: true },
    { label: "History", path: "/history", authOnly: true },
    { label: "Resumes", path: "/resumes", authOnly: true },
  ];

  const filteredLinks = navLinks.filter((link) => !link.authOnly || user);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f7f5f0]/95 backdrop-blur-md border-b border-[#e8e4dc]">
      <nav className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-[#171717] text-[#f7f5f0] flex items-center justify-center font-bold text-xs tracking-tight shadow-xs group-hover:scale-105 transition-transform">
            AI
          </div>
          <span className="text-base font-bold tracking-tight text-[#171717]">
            Interview AI
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "text-[#171717] bg-[#ede8df]"
                    : "text-[#57534e] hover:text-[#171717] hover:bg-[#ede8df]/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Section: Auth Buttons / Profile */}
        <div className="flex items-center gap-2.5">
          {user ? (
            /* User Profile Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white border border-[#e8e4dc] hover:bg-[#faf9f6] transition-colors cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-[#171717] text-white flex items-center justify-center font-semibold text-xs">
                  {getInitials(user.name)}
                </div>
                <span className="text-xs font-semibold text-[#171717] hidden sm:block max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-[#78716c]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#e8e4dc] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#f0ece3]">
                    <p className="font-semibold text-[#171717] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#78716c] truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#44403c] hover:bg-[#f7f5f0]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#78716c]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/history"
                    className="flex items-center gap-2 px-3.5 py-2 text-[#44403c] hover:bg-[#f7f5f0]"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#78716c]" />
                    <span>Past Reports</span>
                  </Link>

                  <div className="border-t border-[#f0ece3] my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sign In Button */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#171717] hover:bg-[#262626] transition-all shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#57534e] hover:bg-[#ede8df] rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden py-3 px-4 border-t border-[#e8e4dc] bg-[#f7f5f0] space-y-1">
          {filteredLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#44403c] hover:bg-[#ede8df]"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-2 border-t border-[#e8e4dc]">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#171717] rounded-lg cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
