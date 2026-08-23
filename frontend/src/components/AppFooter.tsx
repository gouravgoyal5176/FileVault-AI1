import { ShieldCheck, Lock, Sparkles, Cpu, CheckCircle2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const teamMembers = ['Gourav Goyal', 'Saurabh Singh Rawat', 'Bhaskar Raj Singh Thakur'];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-10 mb-6 w-full bg-[#0B0F1E]/85 dark:bg-[#0B0F1E]/85 light:bg-white/95 backdrop-blur-2xl border border-slate-800/90 dark:border-slate-800/90 light:border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xl light:shadow-xl light:shadow-slate-200/60 text-slate-400 dark:text-slate-400 light:text-slate-600 transition-all duration-200 relative overflow-hidden select-none"
    >
      {/* Ambient Background Gradient Mesh & Soft Breathing Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/10 light:bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-400/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row: Brand Identity & Live Security Telemetry Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80">
          
          {/* Brand & Shield Visual */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              {/* Subtle Rotating Security Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-dashed border-indigo-500/40 dark:border-indigo-500/40 light:border-indigo-300"
              />
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white dark:text-white light:text-slate-900 font-sans">
                  FileVault AI
                </h3>
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/30 light:border-indigo-200 shadow-sm">
                  2.0 Enterprise Security Vault
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium mt-0.5">
                Zero-Trust Encrypted File Storage &amp; AI Behavioral Telemetry Engine
              </p>
            </div>
          </div>

          {/* Security Telemetry Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/20 light:border-emerald-200">
              <Lock className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
              <span>AES-256-GCM Envelope</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 light:border-indigo-200">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400 light:text-indigo-600" />
              <span>Session Key Isolation</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 text-purple-300 dark:text-purple-300 light:text-purple-700 border border-purple-500/20 light:border-purple-200">
              <Cpu className="w-3.5 h-3.5 text-purple-400 light:text-purple-600" />
              <span>AI Anomaly Guard</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Tagline, Copyright & Team Signatures */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs pt-1">
          {/* Security Tagline & Copyright */}
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center justify-center md:justify-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              <span>Secure by Design • Built with Security in Mind</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">
              &copy; {currentYear} FileVault AI Enterprise Vault. All rights reserved. Zero-Trust Storage Architecture.
            </p>
          </div>

          {/* Team Credits */}
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-500">
              <Sparkles className="w-3 h-3 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 animate-pulse" />
              <span>Designed &amp; Built by</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 font-bold text-[11px]">
              {teamMembers.map((member) => (
                <motion.span
                  key={member}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="px-3 py-1 rounded-xl bg-[#12182B] dark:bg-[#12182B] light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200/90 text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-indigo-400 dark:hover:text-indigo-300 light:hover:text-indigo-600 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 light:hover:border-indigo-300 transition-all duration-200 shadow-sm cursor-default"
                >
                  {member}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
