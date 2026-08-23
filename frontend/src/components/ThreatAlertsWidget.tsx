import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { ShieldAlert, ShieldCheck, RefreshCw, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SecurityAlert {
  id: string;
  alertType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  resolved: boolean;
  timestamp: string;
}

interface ThreatSummary {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH';
}

export function ThreatAlertsWidget() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [summary, setSummary] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchThreatData = async () => {
    setLoading(true);
    try {
      const [alertsData, summaryData] = await Promise.all([
        apiRequest<{ alerts: SecurityAlert[] }>('/api/threats/alerts'),
        apiRequest<ThreatSummary>('/api/threats/summary'),
      ]);
      setAlerts(alertsData.alerts);
      setSummary(summaryData);
    } catch (err) {
      // Ignore API errors gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-extrabold';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-extrabold';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30 font-semibold';
    }
  };

  return (
    <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xl light:shadow-md light:shadow-slate-200/50 font-sans text-white dark:text-white light:text-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30 shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2.5 tracking-tight">
              Behavioral Threat Monitor
              {summary && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                    summary.threatLevel === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                      : summary.threatLevel === 'ELEVATED'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  STATUS: {summary.threatLevel}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Brute-force, unusual access &amp; bulk download detection</p>
          </div>
        </div>

        <button
          onClick={fetchThreatData}
          disabled={loading}
          className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Refresh Security Alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 text-center py-4 font-medium">Polling threat indicators...</p>
      ) : alerts.length === 0 ? (
        <div className="p-5 bg-[#121829]/60 dark:bg-[#121829]/60 light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-bold text-white dark:text-white light:text-slate-900 tracking-wide">No Security Threats Detected</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Your account shows clean behavioral baseline history.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-3.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs space-y-2 hover:border-slate-700 dark:hover:border-slate-700 light:hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    {alert.alertType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRiskBadge(alert.riskLevel)}`}>
                    {alert.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans">{alert.description}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
