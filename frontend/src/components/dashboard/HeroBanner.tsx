import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles, Lock, ArrowUpRight } from 'lucide-react';

interface HeroBannerProps {
  onOpenUpload: () => void;
  onNavigateSecurity: () => void;
}

export function HeroBanner({ onOpenUpload, onNavigateSecurity }: HeroBannerProps) {
  const { user } = useAuth();
  if (!user) return null;

  const username = user.email.split('@')[0];

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
      {/* Background Subtle SaaS Accent Graphics */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Zero-Trust Enterprise Vault 2.0</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize">
            Welcome back, {username}!
          </h2>

          <p className="text-sm text-indigo-100/90 leading-relaxed font-normal">
            Your encrypted files are secured with AES-256-GCM envelope encryption and real-time AI behavioral telemetry.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Upload New File
            </button>
            <button
              onClick={onNavigateSecurity}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Security Posture</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security Shield Indicator Pill */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shrink-0 flex items-center gap-4 shadow-inner">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-200 block">Vault Protection</span>
            <p className="text-base font-extrabold text-white">OPTIMAL</p>
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> Envelope Encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
