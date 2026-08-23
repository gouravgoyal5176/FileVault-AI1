import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowUpRight, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  onOpenUpload: () => void;
  onNavigateSecurity: () => void;
}

export function HeroBanner({ onOpenUpload, onNavigateSecurity }: HeroBannerProps) {
  const { user } = useAuth();
  if (!user) return null;

  // Format user display name properly (Title Case, no email localpart or numbers)
  const formatDisplayName = () => {
    if ((user as any).name && (user as any).name.trim()) {
      return toTitleCase((user as any).name);
    }
    if ((user as any).fullName && (user as any).fullName.trim()) {
      return toTitleCase((user as any).fullName);
    }
    const rawLocal = user.email.split('@')[0];
    const cleaned = rawLocal.replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
    if (!cleaned) return 'Valued User';

    let parts = cleaned.split(/\s+/);
    if (parts.length === 1) {
      const single = parts[0].toLowerCase();
      if (single === 'gouravgoyal') {
        parts = ['gourav', 'goyal'];
      }
    }
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  const toTitleCase = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const displayName = formatDisplayName();

  // Dynamic greeting based on user's current hour
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="bg-gradient-to-r from-[#0E1328] via-[#0B0F20] to-[#070914] dark:from-[#0E1328] dark:via-[#0B0F20] dark:to-[#070914] light:from-white light:via-slate-50 light:to-indigo-50/40 border border-indigo-500/20 dark:border-indigo-500/20 light:border-slate-200/90 rounded-3xl p-6 md:p-8 text-white dark:text-white light:text-slate-900 shadow-2xl light:shadow-xl light:shadow-slate-200/60 relative overflow-hidden">
      {/* Background Subtle SaaS Accent Graphics */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 text-xs font-bold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Security Status: Protected</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs font-bold backdrop-blur-md">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              <span>AI Telemetry Active</span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            {timeGreeting} {displayName}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed font-normal">
            Your secure digital vault is protected with AES-256-GCM envelope encryption, zero-trust session key isolation, and continuous behavioral anomaly detection.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer border border-indigo-400/30"
            >
              + Upload Encrypted File
            </button>
            <button
              onClick={onNavigateSecurity}
              className="px-4 py-2.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 font-semibold text-xs rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900"
            >
              <span>View Security Posture</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
            </button>
          </div>
        </div>

        {/* Interactive Futuristic Cybersecurity Visual Widget */}
        <div className="relative shrink-0 flex items-center justify-center p-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer Rotating Security Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
            />
            {/* Counter-rotating Inner Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-indigo-400/20"
            />
            {/* Center Pulsing Shield */}
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-400/40 rounded-2xl flex items-center justify-center text-indigo-300 shadow-xl backdrop-blur-md relative z-10">
              <ShieldCheck className="w-10 h-10 text-indigo-400" />
            </div>

            {/* Glowing Accent Particles */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
