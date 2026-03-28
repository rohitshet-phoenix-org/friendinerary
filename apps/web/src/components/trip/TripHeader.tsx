import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { ArrowLeft, Share2, Users, Bot, MoreHorizontal, MapPin, Calendar, Download, Navigation, User, Settings, KeyRound, LogOut } from "lucide-react";

import type { Trip } from "@friendinerary/types";
import toast from "react-hot-toast";

interface TripHeaderProps {
  trip: Trip;
}

const TripHeader = observer(({ trip }: TripHeaderProps) => {
  const { ui, auth, collaboration, settings } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleCopyShareLink = async () => {
    try {
      const link = await collaboration.generateShareLink(trip.id, "view");
      await navigator.clipboard.writeText(link.url);
      toast.success("Share link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
      {/* Back */}
      <Link to="/dashboard" className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white transition-all">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Trip info */}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-gray-900 dark:text-white truncate text-lg tracking-tight">{trip.name}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          {trip.destinations.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-500" /> {trip.destinations.join(", ")}
            </span>
          )}
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {settings.formatShortDate(trip.startDate)}
              {trip.endDate && ` – ${settings.formatDate(trip.endDate)}`}
            </span>
          )}
        </div>
      </div>

      {/* Active collaborators avatars */}
      {collaboration.activeUsers.length > 0 && (
        <div className="flex -space-x-2">
          {collaboration.activeUsers.slice(0, 4).map((u) => (
            <div
              key={u.userId}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-brand-400 to-amber-400 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
              title={u.displayName}
            >
              {u.profilePhoto
                ? <img src={u.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                : u.displayName[0]?.toUpperCase()}
            </div>
          ))}
          {collaboration.activeUsers.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm">
              +{collaboration.activeUsers.length - 4}
            </div>
          )}
        </div>
      )}

      {/* User avatar with dropdown */}
      <UserAvatarDropdown user={auth.user} navigate={navigate} />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <HeaderButton
          onClick={() => ui.toggleAIPanel()}
          active={ui.aiPanelOpen}
          title="AI Assistant"
        >
          <Bot className="w-[18px] h-[18px]" />
        </HeaderButton>
        <HeaderButton onClick={() => ui.openInviteModal()} title="Invite collaborators">
          <Users className="w-[18px] h-[18px]" />
        </HeaderButton>
        <HeaderButton onClick={handleCopyShareLink} title="Share trip">
          <Share2 className="w-[18px] h-[18px]" />
        </HeaderButton>
        <HeaderButton onClick={() => ui.openDirectionsModal()} title="Get directions">
          <Navigation className="w-[18px] h-[18px]" />
        </HeaderButton>
        <HeaderButton onClick={() => ui.openExportModal()} title="Export trip">
          <Download className="w-[18px] h-[18px]" />
        </HeaderButton>

        <div className="relative">
          <HeaderButton onClick={() => setMenuOpen(!menuOpen)} title="More options">
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </HeaderButton>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50">
              <button
                onClick={() => { ui.openInviteModal(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Invite collaborators
              </button>
              <button
                onClick={() => { ui.openExportModal(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Export trip
              </button>
              <button
                onClick={() => { window.print(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function HeaderButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl transition-all ${
        active
          ? "bg-orange-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
          : "text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function UserAvatarDropdown({
  user,
  navigate,
}: {
  user: { displayName: string; email: string; profilePhoto: string | null } | null;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { auth } = useStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full transition-all hover:ring-2 hover:ring-brand-300 focus:ring-2 focus:ring-brand-400 focus:outline-none"
        title={user?.displayName ?? "Profile"}
      >
        {user?.profilePhoto ? (
          <img src={user.profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-gray-100 dark:ring-gray-700">
            {user?.displayName?.[0]?.toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>

          <button
            onClick={() => { navigate("/settings?section=profile"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mt-1"
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
            onClick={() => { handleLogout(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default TripHeader;
