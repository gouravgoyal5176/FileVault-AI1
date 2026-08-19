import { ShieldAlert, Activity, RefreshCw } from 'lucide-react';

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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ELEVATED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-600" /> Behavioral Threat Level
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
          <p className="text-xs text-slate-500 font-medium mt-2">Brute-Force &amp; Bulk Download Detector</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-slate-900">{summary?.activeAlerts ?? 0}</div>
          <span className="text-[10px] text-slate-400 font-medium">Active Alerts</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          Critical Alerts: <strong className="text-slate-800 font-bold">{summary?.criticalAlerts ?? 0}</strong>
        </span>

        <button
          onClick={onNavigateThreats}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
        >
          View Alerts →
        </button>
      </div>
    </div>
  );
}
