import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Activity,
  LifeBuoy,
  Server,
  LogOut
} from 'lucide-react';

export type AdminNavSection =
  | 'admin-overview'
  | 'admin-users'
  | 'admin-security'
  | 'admin-logs'
  | 'admin-support'
  | 'admin-system';

interface AdminSidebarProps {
  activeSection: AdminNavSection;
  setActiveSection: (section: AdminNavSection) => void;
}

export function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const { user, logout } = useAuth();

  if (!user || user.role !== 'ADMIN') return null;

  const menuGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'admin-overview', label: 'Dashboard Overview', icon: LayoutDashboard },
      ],
    },
    {
      group: 'USER MANAGEMENT',
      items: [
        { id: 'admin-users', label: 'Registered Users', icon: Users },
      ],
    },
    {
      group: 'SECURITY & AUDIT',
      items: [
        { id: 'admin-security', label: 'Security Alerts', icon: ShieldAlert },
        { id: 'admin-logs', label: 'Audit Logs', icon: Activity },
      ],
    },
    {
      group: 'SUPPORT & SERVICE',
      items: [
        { id: 'admin-support', label: 'Support Tickets', icon: LifeBuoy },
      ],
    },
    {
      group: 'SYSTEM MONITORING',
      items: [
        { id: 'admin-system', label: 'System Health & Stats', icon: Server },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0B0F1A] border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-2xl">
      <div className="p-5 space-y-6">
        {/* Admin Brand Logo */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 font-sans">
              FileVault <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">ADMIN</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Security Management Console</p>
          </div>
        </div>

        {/* Navigation Menu Groups */}
        <nav className="space-y-5">
          {menuGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as AdminNavSection)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-md'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Admin User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-[#070A12] space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-[#121827] border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-white truncate">{user.email}</p>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SYSTEM ADMINISTRATOR
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition font-bold text-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Console</span>
        </button>
      </div>
    </aside>
  );
}
