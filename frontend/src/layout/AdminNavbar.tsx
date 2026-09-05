import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Search, ShieldAlert, Activity, X, Sun, Moon } from 'lucide-react';

interface AdminNavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefreshData?: () => void;
}

export function AdminNavbar({ searchQuery, setSearchQuery }: AdminNavbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-[#0B0F1A]/90 dark:bg-[#0B0F1A]/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 light:border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xl light:shadow-sm">
      {/* Admin Top Search Bar (Searches Users by Email, User ID, Google ID) */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 light:text-slate-500" />
          <input
            type="text"
            placeholder="Search registered users by email, User ID, Google ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl pl-10 pr-9 py-2 text-xs font-medium text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 light:text-slate-500 hover:text-white dark:hover:text-white light:hover:text-slate-900 p-0.5 rounded cursor-pointer"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Admin System Status Indicators & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/20 text-xs font-bold">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>System Audit Active</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
          <span>Threat Detection Engine 2.0</span>
        </div>

        {/* Global Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-100 dark:hover:text-slate-100 light:hover:text-slate-900 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition cursor-pointer relative"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        <div className="h-6 w-px bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 dark:text-amber-400 light:text-amber-700 font-bold text-xs flex items-center justify-center">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hidden sm:inline max-w-[160px] truncate">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}

