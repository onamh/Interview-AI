import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import {
  Compass,
  LayoutDashboard,
  PlayCircle,
  Clock,
  FileText,
  User,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Practice", path: "/setup", icon: PlayCircle },
    { label: "History", path: "/history", icon: Clock },
    { label: "Resumes", path: "/resumes", icon: FileText },
    { label: "Profile", path: "/profile", icon: User },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-20 bg-[#fbf9f4] dark:bg-[#0f1115] border-r border-[#e8e3d8] dark:border-[#272c38] flex flex-col items-center py-6 justify-between shrink-0 select-none transition-colors">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-6">
        <Link
          to="/"
          className="w-10 h-10 rounded-2xl bg-[#193b2d] text-emerald-300 flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
          title="Interview AI Home"
        >
          <Compass className="w-5 h-5" />
        </Link>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#193b2d] text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Theme Toggle & Logout */}
      <div className="flex flex-col items-center gap-3">
        <ThemeToggle />

        {user && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            title="Log Out"
            className="w-10 h-10 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
