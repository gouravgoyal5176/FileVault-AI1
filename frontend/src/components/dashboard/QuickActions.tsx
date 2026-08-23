import { Upload, RefreshCw, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onOpenUpload: () => void;
  onRefresh: () => void;
  onNavigateSecurity: () => void;
}

export function QuickActions({ onOpenUpload, onRefresh, onNavigateSecurity }: QuickActionsProps) {
  return (
    <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-600">Quick Actions</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenUpload}
          className="p-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 rounded-xl border border-indigo-500/30 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer shadow-lg shadow-indigo-500/5"
        >
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 dark:text-indigo-400 light:text-indigo-600 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold">Upload File</span>
        </motion.button>

        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRefresh}
          className="p-4 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer hover:text-white dark:hover:text-white light:hover:text-slate-900"
        >
          <div className="p-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-700 rounded-lg group-hover:rotate-180 transition-transform duration-500">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold">Refresh Vault</span>
        </motion.button>

        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onNavigateSecurity}
          className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 rounded-xl border border-emerald-500/30 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer shadow-lg shadow-emerald-500/5"
        >
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 dark:text-emerald-400 light:text-emerald-600 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold">Security Score</span>
        </motion.button>

        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onNavigateSecurity}
          className="p-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 dark:text-purple-300 light:text-purple-700 rounded-xl border border-purple-500/30 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer shadow-lg shadow-purple-500/5"
        >
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 dark:text-purple-400 light:text-purple-600 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-extrabold">Audit Explorer</span>
        </motion.button>
      </div>
    </div>
  );
}
