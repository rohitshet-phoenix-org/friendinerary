import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { MapPin, Globe, Compass, Map, Settings, LogOut, Moon, Sun, Crown } from "lucide-react";

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
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <MapPin className="w-7 h-7 text-brand-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Friendinerary</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/dashboard" icon={<Globe className="w-4 h-4" />} label="My Trips" />
          <NavItem to="/explore" icon={<Compass className="w-4 h-4" />} label="Explore" />
          <NavItem to="/pinboard" icon={<Map className="w-4 h-4" />} label="Pinboard" />
          <NavItem to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Pro badge */}
          {!auth.isPro && (
            <Link
              to="/pro"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Link>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => ui.toggleDarkMode()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
          >
            {ui.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {ui.darkMode ? "Light mode" : "Dark mode"}
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            {auth.user?.profilePhoto ? (
              <img src={auth.user.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-medium text-sm">
                {auth.user?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {auth.user?.displayName}
              </p>
              <p className="text-xs text-gray-400 truncate">{auth.user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
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
  const isActive = window.location.pathname === to || window.location.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-brand-50 text-brand-600 font-medium dark:bg-brand-900/20 dark:text-brand-400"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default AppLayout;
