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
      return 'bg-slate-100 text-slate-500 border-slate-200';
    }
    switch (category) {
      case 'NORMAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEDIUM_ANOMALY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 font-sans transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
              AI Behavioral Anomaly Detection Engine
              <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded-full">7-VECTOR MODEL</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">Deterministic 7-vector statistical behavior analyzer</p>
          </div>
        </div>

        <button
          onClick={fetchAnomalySummary}
          disabled={loading}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Re-evaluate Anomaly Score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !data ? (
        <p className="text-xs text-slate-400 py-4 text-center font-medium">Evaluating behavioral telemetry pattern...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                {data.anomalyScore.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal">/ 1.00</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Baseline History: <strong className="text-slate-800">{data.metrics.totalHistoryLogs}</strong> Activity Logs (14-day window)
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
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f1 Activity</span>
              <span className="font-extrabold text-indigo-600 text-xs">{(data.featureVector.f1_activityFrequency * 0.10).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f2 Failed Logins</span>
              <span className="font-extrabold text-amber-600 text-xs">{(data.featureVector.f2_failedLoginFrequency * 0.20).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f3 Downloads</span>
              <span className="font-extrabold text-purple-600 text-xs">{(data.featureVector.f3_downloadFrequency * 0.20).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f4 Access Hour</span>
              <span className="font-extrabold text-blue-600 text-xs">{(data.featureVector.f4_unusualLoginTime * 0.15).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f5 IP Anomaly</span>
              <span className="font-extrabold text-emerald-600 text-xs">{(data.featureVector.f5_ipChange * 0.15).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f6 Device Anomaly</span>
              <span className="font-extrabold text-indigo-600 text-xs">{(data.featureVector.f6_deviceChange * 0.10).toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 block font-bold">f7 Burst Time</span>
              <span className="font-extrabold text-rose-600 text-xs">{(data.featureVector.f7_activityBurst * 0.10).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
              Non-sensitive security metadata analysis only
            </span>
            <span>Evaluated: {new Date(data.evaluatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
