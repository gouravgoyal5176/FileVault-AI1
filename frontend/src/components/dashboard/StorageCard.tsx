import { HardDrive, Server } from 'lucide-react';
import { motion } from 'framer-motion';

interface StorageCardProps {
  totalBytes: number;
  fileCount: number;
}

export function StorageCard({ totalBytes, fileCount }: StorageCardProps) {
  const maxBytes = 2 * 1024 * 1024 * 1024; // 2 GB standard allocation
  const percentage = Math.min(100, Math.max(1, (totalBytes / maxBytes) * 100));

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4 dark:hover:border-indigo-500/40 dark:hover:shadow-indigo-500/10 light:hover:border-slate-300 light:hover:shadow-lg light:hover:shadow-slate-200/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Storage Quota
        </span>
        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          MinIO Object Store
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            {formatSize(totalBytes)}{' '}
            <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">/ 2.00 GB</span>
          </div>
          <span className="text-xs font-extrabold text-indigo-400 dark:text-indigo-400 light:text-indigo-600">{percentage.toFixed(1)}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 pt-2 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
        <span className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-slate-400 light:text-slate-600">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          Encrypted Payload Files
        </span>
        <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">{fileCount} Files</span>
      </div>
    </motion.div>
  );
}
