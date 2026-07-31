import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { ShieldAlert, ShieldCheck, RefreshCw, Bell } from 'lucide-react';

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
      // Ignore errors if threats API not reachable yet
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
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]';
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] font-mono transition-all duration-300 hover:border-cyan-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2.5 tracking-tight">
              BEHAVIORAL THREAT MONITOR
              {summary && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                    summary.threatLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                      : summary.threatLevel === 'ELEVATED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                  }`}
                >
                  STATUS: {summary.threatLevel}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Brute-force, unusual access &amp; bulk download detection</p>
          </div>
        </div>

        <button
          onClick={fetchThreatData}
          disabled={loading}
          className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50"
          title="Refresh Security Alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-cyan-400/80 text-center py-4 tracking-wider">POLLING THREAT INDICATORS...</p>
      ) : alerts.length === 0 ? (
        <div className="p-5 bg-slate-950/80 rounded-2xl border border-white/5 text-center space-y-1.5 shadow-inner">
          <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto animate-pulse" />
          <p className="text-xs font-bold text-white tracking-wide">NO SECURITY THREATS DETECTED</p>
          <p className="text-[11px] text-slate-400">Your account shows clean behavioral baseline history.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 text-xs space-y-2 hover:border-cyan-500/30 transition-all duration-300 shadow-inner"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  {alert.alertType}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRiskBadge(alert.riskLevel)}`}>
                  {alert.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{alert.description}</p>
              <p className="text-[10px] text-slate-400">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
