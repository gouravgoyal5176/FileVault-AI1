import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  HardDrive,
  Share2,
  ShieldAlert,
  Upload,
  Shield,
  Sliders,
  LogOut
} from 'lucide-react';

export type NavTab = 'dashboard' | 'vault' | 'shared' | 'security' | 'threats' | 'admin' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenUpload: () => void;
}

export function Sidebar({ activeTab, setActiveTab, onOpenUpload }: SidebarProps) {
  const { user, logout, logoutAll } = useAuth();

  if (!user) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'My Vault', icon: HardDrive },
    { id: 'shared', label: 'Shared Files', icon: Share2 },
    { id: 'security', label: 'Security Center', icon: ShieldCheck },
    { id: 'threats', label: 'Threat Monitor', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Dashboard', icon: Shield });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-xs">
      <div className="p-5 space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
              FileVault <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold">AI 2.0</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Enterprise Security Vault</p>
          </div>
        </div>

        {/* Quick Upload Button */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Upload File</span>
        </button>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Vault Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.email}</p>
            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded ${
              user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition font-medium text-[11px] cursor-pointer"
            title="Log out from current browser"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Logout</span>
          </button>

          <button
            onClick={logoutAll}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition font-medium text-[11px] cursor-pointer"
            title="Revoke all device sessions"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Revoke All</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
