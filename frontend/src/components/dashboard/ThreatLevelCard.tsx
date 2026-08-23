import { ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreatSummary {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH';
}

interface ThreatLevelCardProps {
  summary: ThreatSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateThreats: () => void;
}

export function ThreatLevelCard({ summary, loading, onRefresh, onNavigateThreats }: ThreatLevelCardProps) {
  const threatLevel = summary ? summary.threatLevel : 'NORMAL';

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'ELEVATED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col justify-between space-y-4 dark:hover:border-indigo-500/40 dark:hover:shadow-indigo-500/10 light:hover:border-slate-300 light:hover:shadow-lg light:hover:shadow-slate-200/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Behavioral Threat Level
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition cursor-pointer"
          title="Refresh Threat Level"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border inline-block ${getThreatBadge(threatLevel)}`}>
            STATUS: {threatLevel}
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium mt-2">Brute-Force &amp; Anomaly Detector</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900">{summary?.activeAlerts ?? 0}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">Active Alerts</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 text-xs">
        <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          Critical Alerts: <strong className="text-white dark:text-white light:text-slate-900 font-bold">{summary?.criticalAlerts ?? 0}</strong>
        </span>

        <button
          onClick={onNavigateThreats}
          className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 dark:hover:text-indigo-300 light:hover:text-indigo-700 transition cursor-pointer"
        >
          View Alerts →
        </button>
      </div>
    </motion.div>
  );
}
