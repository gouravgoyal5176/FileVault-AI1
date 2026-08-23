import { Activity, KeyRound, Upload, Download, Share2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  logs: AuditLog[];
  loading: boolean;
}

export function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
  const getActionIcon = (type: string) => {
    if (type.includes('LOGIN')) return <KeyRound className="w-3.5 h-3.5 text-indigo-400" />;
    if (type.includes('UPLOAD')) return <Upload className="w-3.5 h-3.5 text-blue-400" />;
    if (type.includes('DOWNLOAD')) return <Download className="w-3.5 h-3.5 text-emerald-400" />;
    if (type.includes('SHARE')) return <Share2 className="w-3.5 h-3.5 text-purple-400" />;
    if (type.includes('HONEYFILE') || type.includes('TAMPER')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getBadgeStyle = (type: string) => {
    if (type.includes('FAILED') || type.includes('TAMPER') || type.includes('HONEYFILE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (type.includes('SUCCESS') || type.includes('UPLOAD') || type.includes('DOWNLOAD')) {
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
  };

  return (
    <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Recent Vault Telemetry
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Live Telemetry
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 py-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-600 dark:text-slate-600 light:text-slate-400 mx-auto" />
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">No recent security events recorded.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 dark:before:bg-slate-800 light:before:bg-slate-200">
          {logs.slice(0, 5).map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex items-start gap-3 group"
            >
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#121829] dark:bg-[#121829] light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 flex items-center justify-center shadow-md group-hover:border-indigo-500 transition-colors">
                {getActionIcon(log.actionType)}
              </div>

              <div className="flex-1 space-y-1 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50 p-2.5 rounded-xl border border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 group-hover:border-slate-700/80 dark:group-hover:border-slate-700/80 light:group-hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getBadgeStyle(log.actionType)}`}>
                    {log.actionType}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono flex items-center gap-2">
                  <span>IP: {log.ipAddress}</span>
                  <span className="text-slate-600 dark:text-slate-600 light:text-slate-400">•</span>
                  <span className="truncate max-w-[200px]">{log.userAgent}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
