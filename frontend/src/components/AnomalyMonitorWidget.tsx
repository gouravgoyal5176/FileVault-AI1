import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { Cpu, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showVectors, setShowVectors] = useState(false);

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
      return 'bg-slate-800 text-slate-400 border-slate-700';
    }
    switch (category) {
      case 'NORMAL':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'MEDIUM_ANOMALY':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse';
    }
  };

  return (
    <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4 font-sans text-white dark:text-white light:text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-xl border border-indigo-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm tracking-tight flex items-center gap-2">
              AI Behavioral Anomaly Detection Engine
              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 font-bold px-2 py-0.5 rounded-full">7-VECTOR MODEL</span>
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Deterministic 7-vector statistical behavior analyzer</p>
          </div>
        </div>

        <button
          onClick={fetchAnomalySummary}
          disabled={loading}
          className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Re-evaluate Anomaly Score"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !data ? (
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 py-4 text-center font-medium">Evaluating behavioral telemetry pattern...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div>
              <div className="text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight flex items-baseline gap-1">
                {data.anomalyScore.toFixed(2)}
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">/ 1.00</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1 font-medium">
                Baseline History: <strong className="text-white dark:text-white light:text-slate-900">{data.metrics.totalHistoryLogs}</strong> Activity Logs (14-day window)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border ${getStatusBadge(data.riskCategory, data.status)}`}>
                {data.status === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT DATA (<5 LOGS)' : data.riskCategory}
              </span>
              <button
                onClick={() => setShowVectors(!showVectors)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 text-xs font-bold rounded-xl border border-indigo-500/30 transition cursor-pointer"
              >
                <span>{showVectors ? 'Hide Analysis' : 'View 7-Vector Analysis'}</span>
                {showVectors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showVectors && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5 text-[10px]">
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F1: Frequency</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f1_activityFrequency.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F2: Failed Logins</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f2_failedLoginFrequency.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F3: Downloads</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f3_downloadFrequency.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F4: Time Offsets</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f4_unusualLoginTime.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F5: IP Change</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f5_ipChange.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F6: Device Drift</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f6_deviceChange.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F7: Burst Ratio</span>
                    <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">{data.featureVector.f7_activityBurst.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 pt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              Non-sensitive security metadata analysis only
            </span>
            <span>Evaluated: {new Date(data.evaluatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
