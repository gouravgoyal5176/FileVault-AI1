import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, ShieldAlert, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { user, logout, logoutAll } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2 font-mono">
            FILE<span className="text-cyan-400">VAULT</span>
            <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold px-2 py-0.5 rounded-full">AI 2.0</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">Zero-Trust Encrypted File Vault &amp; Cyber Telemetry</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs shadow-inner">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-semibold text-slate-200">{user.email}</span>
          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wider uppercase ${
            user.role === 'ADMIN' 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
          }`}>
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
            title="Log out from current browser device"
          >
            <LogOut className="w-3.5 h-3.5 text-cyan-400" />
            Logout
          </button>

          <button
            onClick={logoutAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium border border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
            title="Revoke all refresh tokens on all devices"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Logout All Devices
          </button>
        </div>
      </div>
    </header>
  );
}
