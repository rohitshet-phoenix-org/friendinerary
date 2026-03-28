import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { MapPin, Globe, Compass, Map, Settings, LogOut, Moon, Sun, Crown, User, KeyRound, ChevronUp } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = observer(({ children }: AppLayoutProps) => {
  const { auth, ui } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.logout();
    navigate("/login");
  };

  return (
    <div className={`min-h-screen flex ${ui.darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Friendinerary</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          <NavItem to="/dashboard" icon={<Globe className="w-[18px] h-[18px]" />} label="My Trips" />
          <NavItem to="/explore" icon={<Compass className="w-[18px] h-[18px]" />} label="Explore" />
          <NavItem to="/pinboard" icon={<Map className="w-[18px] h-[18px]" />} label="Pinboard" />
          <NavItem to="/settings" icon={<Settings className="w-[18px] h-[18px]" />} label="Settings" />
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-1.5 border-t border-gray-100 dark:border-gray-800">
          {/* Pro badge */}
          {!auth.isPro && (
            <Link
              to="/pro"
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => ui.toggleDarkMode()}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
          >
            {ui.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {ui.darkMode ? "Light mode" : "Dark mode"}
          </button>

          {/* User profile with dropdown */}
          <ProfileMenu
            user={auth.user}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 bg-gray-50 dark:bg-gray-950 min-h-screen">
        {children}
      </main>
    </div>
  );
});

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
        isActive
          ? "bg-orange-50 text-brand-600 font-semibold dark:bg-brand-900/20 dark:text-brand-400 shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function ProfileMenu({ user, onLogout }: { user: { displayName: string; email: string; profilePhoto: string | null } | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Dropdown menu — opens upward */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
          <button
            onClick={() => { navigate("/settings?section=profile"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" />
            View profile
          </button>
          <button
            onClick={() => { navigate("/settings?section=profile"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            Edit profile
          </button>
          <button
            onClick={() => { navigate("/settings?section=security"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-gray-400" />
            Change password
          </button>
          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}

      {/* Profile button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
      >
        {user?.profilePhoto ? (
          <img src={user.profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {user?.displayName?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {user?.displayName}
          </p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <ChevronUp className={`w-4 h-4 text-gray-300 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}

export default AppLayout;
