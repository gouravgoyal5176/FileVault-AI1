import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Bell, Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { UserProfileDropdown } from '../components/UserProfileDropdown';

interface UserNavbarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenUpload?: () => void;
  onNavigateTab?: (tab: 'security' | 'threats' | 'vault' | 'shared') => void;
}

export function UserNavbar({ onNavigateTab }: UserNavbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white/90 backdrop-blur-xl border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-lg">
      {/* System Brand / Status Badge */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>AES-256 Protected</span>
      </div>

      {/* Right User Actions & Status Indicators */}
      <div className="flex items-center gap-3">

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-100 dark:hover:text-slate-100 light:hover:text-slate-900 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition cursor-pointer relative"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Notification Bell Trigger */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-indigo-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-[#0B0F1E] dark:ring-[#0B0F1E] light:ring-white shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></span>
          </button>

          <NotificationDropdown
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            onNavigateTab={(tab) => {
              if (onNavigateTab) onNavigateTab(tab);
            }}
          />
        </div>

        <div className="h-6 w-px bg-slate-800 dark:bg-slate-800 light:bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile Clickable Area & Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition cursor-pointer"
            title="User Profile Account Details"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 text-white font-bold text-xs flex items-center justify-center shadow-md">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hidden lg:inline max-w-[140px] truncate">
              {user?.email}
            </span>
          </button>

          <UserProfileDropdown
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
