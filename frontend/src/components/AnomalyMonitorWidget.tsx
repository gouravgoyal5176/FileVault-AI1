import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { Cpu, RefreshCw, AlertCircle } from 'lucide-react';

interface FeatureVector {
  f1_activityFrequency: number;
  f2_failedLoginFrequency: number;
  f3_downloadFrequency: number;
  f4_unusualLoginTime: number;
  f5_ipChange: number;
  f6_deviceChange: number;
  f7_activityBurst: number;
}

interface AnomalySummary {
  evaluatedAt: string;
  userId: string;
  anomalyScore: number;
  riskCategory: 'NORMAL' | 'MEDIUM_ANOMALY' | 'HIGH_ANOMALY';
  status: 'EVALUATED' | 'INSUFFICIENT_DATA';
  alertGenerated: boolean;
  alertSuppressed: boolean;
  featureVector: FeatureVector;
  metrics: {
    totalHistoryLogs: number;
    activity24h: number;
    baselineDailyAvg: number;
    failedLogins24h: number;
    downloads1h: number;
    currentHour: number;
    medianHour: number;
    isNewIp: boolean;
    isNewDevice: boolean;
    lastTimeGapSeconds: number | null;
  };
}

export function AnomalyMonitorWidget() {
  const [data, setData] = useState<AnomalySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnomalySummary = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AnomalySummary>('/api/threats/behavioral-summary');
      setData(res);
    } catch (err) {
      // Ignore API errors gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalySummary();
  }, []);

  const getStatusBadge = (category: string, status: string) => {
    if (status === 'INSUFFICIENT_DATA') {
      return 'bg-slate-800/80 text-slate-400 border-white/10';
    }
    switch (category) {
      case 'NORMAL':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
      case 'MEDIUM_ANOMALY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse';
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] space-y-4 font-mono transition-all duration-300 hover:border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
              AI BEHAVIORAL ANOMALY ENGINE
              <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold px-2 py-0.5 rounded-full">HUD MODEL</span>
            </h4>
            <p className="text-[11px] text-slate-400">Deterministic 7-vector statistical behavior analyzer</p>
          </div>
        </div>

        <button
          onClick={fetchAnomalySummary}
          disabled={loading}
          className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50"
          title="Re-evaluate Anomaly Score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !data ? (
        <p className="text-xs text-cyan-400/80 py-4 text-center tracking-wider">EVALUATING BEHAVIORAL TELEMETRY PATTERN...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
            <div>
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                {data.anomalyScore.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal">/ 1.00</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Baseline History: <span className="text-cyan-300 font-bold">{data.metrics.totalHistoryLogs}</span> Activity Logs (14-day window)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border ${getStatusBadge(data.riskCategory, data.status)}`}>
                {data.status === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT DATA (<5 LOGS)' : data.riskCategory}
              </span>
            </div>
          </div>

          {/* 7-Vector Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5 text-[10px]">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f1 Activity</span>
              <span className="font-extrabold text-cyan-300 text-xs">{(data.featureVector.f1_activityFrequency * 0.10).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-amber-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f2 Failed Logins</span>
              <span className="font-extrabold text-amber-300 text-xs">{(data.featureVector.f2_failedLoginFrequency * 0.20).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-purple-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f3 Downloads</span>
              <span className="font-extrabold text-purple-300 text-xs">{(data.featureVector.f3_downloadFrequency * 0.20).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-blue-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f4 Access Hour</span>
              <span className="font-extrabold text-blue-300 text-xs">{(data.featureVector.f4_unusualLoginTime * 0.15).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f5 IP Anomaly</span>
              <span className="font-extrabold text-emerald-300 text-xs">{(data.featureVector.f5_ipChange * 0.15).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f6 Device Anomaly</span>
              <span className="font-extrabold text-indigo-300 text-xs">{(data.featureVector.f6_deviceChange * 0.10).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 hover:border-rose-500/40 transition-all duration-300">
              <span className="text-slate-400 block font-bold">f7 Burst Time</span>
              <span className="font-extrabold text-rose-300 text-xs">{(data.featureVector.f7_activityBurst * 0.10).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              Non-sensitive security metadata analysis only
            </span>
            <span>Evaluated: {new Date(data.evaluatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
