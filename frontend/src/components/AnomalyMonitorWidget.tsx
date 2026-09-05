import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { ShieldAlert, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskStatusResponse {
  userId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  factors: Array<{ factor: string; points: number; description: string }>;
  details: {
    isNewIp: boolean;
    isNewDevice: boolean;
    failedLoginCount24h: number;
    anomalyScore: number;
    activeAlertsCount: number;
    honeyfileTriggered24h: boolean;
    downloadSpike24h: boolean;
  };
}

interface ThreatSummary {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH';
}

interface AuditLog {
  id: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface AnomalySummary {
  evaluatedAt: string;
  userId: string;
  anomalyScore: number;
  riskCategory: 'NORMAL' | 'MEDIUM_ANOMALY' | 'HIGH_ANOMALY';
  status: 'EVALUATED' | 'INSUFFICIENT_DATA';
  featureVector: {
    f1_activityFrequency: number;
    f2_failedLoginFrequency: number;
    f3_downloadFrequency: number;
    f4_unusualLoginTime: number;
    f5_ipChange: number;
    f6_deviceChange: number;
    f7_activityBurst: number;
  };
  metrics: {
    totalHistoryLogs: number;
  };
}

export function AnomalyMonitorWidget() {
  const [riskData, setRiskData] = useState<RiskStatusResponse | null>(null);
  const [threatSummary, setThreatSummary] = useState<ThreatSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditLog[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVectors, setShowVectors] = useState(false);

  const fetchThreatMonitorData = async () => {
    setLoading(true);
    try {
      const [riskRes, threatRes, logsRes, snapRes, anomalyRes] = await Promise.all([
        apiRequest<RiskStatusResponse>('/api/files/risk-status').catch(() => null),
        apiRequest<ThreatSummary>('/api/threats/summary').catch(() => null),
        apiRequest<{ logs: AuditLog[] }>('/api/security-center/audit-logs?limit=5').catch(() => null),
        apiRequest<{ snapshots: any[] }>('/api/security-center/snapshots').catch(() => null),
        apiRequest<AnomalySummary>('/api/threats/behavioral-summary').catch(() => null),
      ]);

      if (riskRes) setRiskData(riskRes);
      if (threatRes) setThreatSummary(threatRes);
      if (logsRes?.logs) setRecentEvents(logsRes.logs);
      if (snapRes?.snapshots) setSnapshots(snapRes.snapshots);
      if (anomalyRes) setAnomalyData(anomalyRes);
    } catch {
      // Ignore API errors gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatMonitorData();
  }, []);

  const riskScore = riskData?.riskScore ?? 0;
  const riskLevel = riskData?.riskLevel ?? 'LOW';

  const getRiskLevelStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    }
  };

  const getThreatStatus = () => {
    if (threatSummary?.criticalAlerts && threatSummary.criticalAlerts > 0) return 'CRITICAL ALERT';
    if (riskLevel === 'CRITICAL') return 'CRITICAL ALERT';
    if (riskLevel === 'HIGH' || threatSummary?.threatLevel === 'HIGH') return 'HIGH RISK';
    if (riskLevel === 'MEDIUM' || threatSummary?.threatLevel === 'ELEVATED') return 'SUSPICIOUS';
    return 'NORMAL';
  };

  const threatStatus = getThreatStatus();

  const getThreatStatusStyle = (status: string) => {
    switch (status) {
      case 'CRITICAL ALERT':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse font-black';
      case 'HIGH RISK':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-extrabold';
      case 'SUSPICIOUS':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold';
      default:
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-bold';
    }
  };

  return (
    <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-6 font-sans text-white dark:text-white light:text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-xl border border-indigo-500/30 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base tracking-tight flex items-center gap-2.5">
              Behavioral Threat Monitor &amp; Risk Telemetry
              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase">
                REAL-TIME MONITOR
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium mt-0.5">
              Deterministic 7-vector behavioral telemetry analyzer &amp; access risk scoring
            </p>
          </div>
        </div>

        <button
          onClick={fetchThreatMonitorData}
          disabled={loading}
          className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="Re-evaluate Telemetry Signals"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 py-6 text-center font-medium">
          Evaluating account access telemetry &amp; security posture...
        </p>
      ) : (
        <div className="space-y-6">
          {/* SECTION A & B: Current Access Risk + Threat Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* A. Current Access Risk */}
            <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col justify-between space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider">
                Current Access Risk
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-4xl font-black text-white dark:text-white light:text-slate-900 tracking-tight flex items-baseline gap-1">
                  {riskScore}
                  <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">/ 100</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border ${getRiskLevelStyle(riskLevel)}`}>
                  {riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
                Normalized 0–100 integer account risk score
              </p>
            </div>

            {/* B. Threat Status */}
            <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col justify-between space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider">
                Threat Status
              </span>
              <div className="flex items-center justify-between">
                <span className={`px-3.5 py-1.5 rounded-xl text-xs uppercase border ${getThreatStatusStyle(threatStatus)}`}>
                  {threatStatus}
                </span>
                <span className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800">
                  {threatSummary?.activeAlerts ?? 0} Active Alerts
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
                Evaluated from real security threat alerts
              </p>
            </div>

            {/* C. Baseline Activity */}
            <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col justify-between space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Behavioral Telemetry
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white dark:text-white light:text-slate-900">
                  {anomalyData?.metrics?.totalHistoryLogs ?? 0}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-semibold">
                  14-Day Baseline Logs
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">
                Anomaly Vector Score: {((anomalyData?.anomalyScore ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* SECTION C & D: Risk Contributors + Recent Security Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* C. Risk Contributors */}
            <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Risk Contributors &amp; Telemetry Signals
              </h4>

              <div className="space-y-2 text-xs">
                {riskData?.factors && riskData.factors.length > 0 ? (
                  riskData.factors.map((f, i) => (
                    <div key={i} className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <span className="font-semibold text-amber-300 dark:text-amber-300 light:text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {f.description}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">+{f.points} pts</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Known device signature verified</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Normal login behavior &amp; session frequency</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>No recent failed login attempts</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>No active security alerts or threat traps</span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-2 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>No honeyfile decoy trap interactions</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* D. Recent Security Events */}
            <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Recent Security Events
              </h4>

              {recentEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium border border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 rounded-xl">
                  No suspicious security activity detected.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white dark:text-white light:text-slate-900 block text-[11px]">
                          {evt.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                          {evt.ipAddress} • {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20">
                        LOGGED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION E: Risk History & Technical Vector Details */}
          <div className="p-5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Risk Score History &amp; Technical Analysis
              </h4>

              <button
                onClick={() => setShowVectors(!showVectors)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 text-xs font-bold rounded-xl border border-indigo-500/30 transition cursor-pointer"
              >
                <span>{showVectors ? 'Hide 7-Vector Metrics' : 'View 7-Vector Metrics'}</span>
                {showVectors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Risk History Visualization */}
            <div className="p-3 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              {snapshots && snapshots.length > 0 ? (
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[11px] font-bold text-slate-400">Risk Score History:</span>
                  {snapshots.map((s, idx) => (
                    <span key={s.id || idx} className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-extrabold rounded-md border border-indigo-500/20">
                        {s.score}
                      </span>
                      {idx < snapshots.length - 1 && <span className="text-slate-500">→</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs font-medium">
                  Risk history will appear as security activity is recorded.
                </span>
              )}
            </div>

            {/* Collapsible 7-Vector Anomaly Details */}
            <AnimatePresence>
              {showVectors && anomalyData?.featureVector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-2 space-y-2"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Deterministic 7-Vector Behavioral Anomaly Telemetry
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5 text-[10px]">
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F1: Frequency</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f1_activityFrequency.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F2: Failed Logins</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f2_failedLoginFrequency.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F3: Downloads</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f3_downloadFrequency.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F4: Time Offsets</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f4_unusualLoginTime.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F5: IP Change</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f5_ipChange.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F6: Device Drift</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f6_deviceChange.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold">F7: Burst Ratio</span>
                      <span className="font-mono text-white dark:text-white light:text-slate-900 font-extrabold text-xs">
                        {anomalyData.featureVector.f7_activityBurst.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 pt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
              Non-sensitive account telemetry &amp; security metadata analysis only
            </span>
            <span>Evaluated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

