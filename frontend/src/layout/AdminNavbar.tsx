import { useAuth } from '../context/AuthContext';
import { Search, ShieldAlert, Activity, X } from 'lucide-react';

interface AdminNavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefreshData?: () => void;
}

export function AdminNavbar({ searchQuery, setSearchQuery }: AdminNavbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-[#0B0F1A]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xl">
      {/* Admin Top Search Bar (Searches Users by Email, User ID, Google ID) */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search registered users by email, User ID, Google ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121827] border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Admin System Status Indicators */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>System Audit Active</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>Threat Detection Engine 2.0</span>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[160px] truncate">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
