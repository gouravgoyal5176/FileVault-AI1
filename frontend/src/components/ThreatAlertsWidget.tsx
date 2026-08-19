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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm font-sans transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2.5 tracking-tight">
              Behavioral Threat Monitor
              {summary && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                    summary.threatLevel === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      : summary.threatLevel === 'ELEVATED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  STATUS: {summary.threatLevel}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Brute-force, unusual access &amp; bulk download detection</p>
          </div>
        </div>

        <button
          onClick={fetchThreatData}
          disabled={loading}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Refresh Security Alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 text-center py-4 font-medium">Polling threat indicators...</p>
      ) : alerts.length === 0 ? (
        <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-center space-y-1.5">
          <ShieldCheck className="w-7 h-7 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800 tracking-wide">No Security Threats Detected</p>
          <p className="text-[11px] text-slate-500 font-medium">Your account shows clean behavioral baseline history.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-2 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  {alert.alertType}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRiskBadge(alert.riskLevel)}`}>
                  {alert.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{alert.description}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
