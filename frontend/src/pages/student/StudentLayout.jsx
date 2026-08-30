import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Icon } from "../../components/Icons.jsx";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Icon.overview, end: true },
  { to: "/available-tests", label: "Available Tests", icon: Icon.tests },
  { to: "/my-tests", label: "My Tests", icon: Icon.bank },
  { to: "/my-results", label: "Results", icon: Icon.results },
  { to: "/profile", label: "Profile", icon: Icon.user },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user?.fullName || "S").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500 flex items-center justify-center font-extrabold text-navy-950 text-sm">AI</div>
            <div>
              <p className="font-extrabold text-[15px] leading-tight tracking-tight">AI CLUB</p>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">Recruitment Platform</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `focus-ring flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="focus-ring h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-pop border border-line overflow-hidden animate-fade-in">
                <div className="p-3 border-b border-line">
                  <p className="text-sm font-semibold text-ink-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="focus-ring w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50"
                >
                  <Icon.logout size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-line flex items-stretch">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `focus-ring flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                isActive ? "text-cyan-600" : "text-ink-400"
              }`
            }
          >
            <item.icon size={19} />
            {item.label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
