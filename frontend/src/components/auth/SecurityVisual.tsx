import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Cpu, KeyRound } from 'lucide-react';

interface SecurityVisualProps {
  mode: 'login' | 'register';
}

export function SecurityVisual({ mode }: SecurityVisualProps) {
  const isLogin = mode === 'login';

  const badges = isLogin
    ? [
        { label: 'AES-256 Envelope Encryption', icon: Lock, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
        { label: 'Multi-Factor Verification (OTP)', icon: KeyRound, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' },
        { label: 'AI Behavioral Threat Telemetry', icon: Cpu, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' },
      ]
    : [
        { label: 'Zero-Trust Architecture', icon: ShieldCheck, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' },
        { label: 'Military-Grade Key Wrapping', icon: Lock, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
        { label: 'Gmail SMTP OTP Verification', icon: KeyRound, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' },
      ];

  return (
    <div className="relative flex flex-col justify-between h-full p-4 lg:p-8 select-none text-slate-100 z-10">
      {/* Brand Header */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
          <div className="p-1 bg-indigo-500/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase font-mono">
            FileVault AI 2.0 • Zero-Trust
          </span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white">
          {isLogin ? (
            <>
              Your Files.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Your Privacy.
              </span><br />
              Your Vault.
            </>
          ) : (
            <>
              Build Your<br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Digital Vault.
              </span>
            </>
          )}
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed max-w-md font-normal">
          {isLogin
            ? 'Secure your sensitive files with client-isolated envelope encryption, intelligent threat monitoring, and two-factor authentication.'
            : 'Establish your encrypted cloud vault equipped with cryptographic key-wrapping, SHA-256 integrity checks, and verified email identity.'}
        </p>
      </motion.div>

      {/* Central Interactive Vault Emblem Visual */}
      <motion.div 
        className="relative my-8 flex items-center justify-center py-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Outer Rotating Cyber Ring */}
        <motion.div
          className="absolute w-64 h-64 lg:w-72 lg:h-72 rounded-full border border-dashed border-indigo-500/20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        />

        {/* Counter Rotating Ring */}
        <motion.div
          className="absolute w-52 h-52 lg:w-56 lg:h-56 rounded-full border border-cyan-500/25 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />

        {/* Pulsing Core Glowing Shield Icon */}
        <div className="relative w-36 h-36 lg:w-40 lg:h-40 rounded-3xl bg-gradient-to-br from-[#0E1528] to-[#080B14] border border-indigo-500/30 flex items-center justify-center shadow-2xl shadow-indigo-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-xl" />

          {/* SVG Shield Emblem */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
              <ShieldCheck className="w-10 h-10 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
              AES-256 ENCRYPTED
            </span>
          </div>
        </div>

        {/* Floating Telemetry Status Badge */}
        <motion.div
          className="absolute -bottom-2 bg-[#0B0F1A]/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-xl flex items-center gap-2 backdrop-blur-md"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-semibold text-slate-300">
            SYSTEM TELEMETRY: OPTIMAL
          </span>
        </motion.div>
      </motion.div>

      {/* Feature Badges List */}
      <motion.div 
        className="space-y-2.5 pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${b.color}`}
              whileHover={{ x: 6 }}
            >
              <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-slate-200">{b.label}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
