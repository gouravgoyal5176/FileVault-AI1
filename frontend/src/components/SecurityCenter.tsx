import { useState, useEffect, FormEvent } from 'react';
import { apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Activity,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Lock
} from 'lucide-react';

interface ScoreMetrics {
  totalFiles: number;
  tamperedFiles: number;
  recentFailedLogins: number;
  isLockedOut: boolean;
  activeCriticalAlerts: number;
  activeHighAlerts: number;
  activeMediumAlerts: number;
  expiredSharesCount: number;
  indefiniteSharesCount: number;
  honeyfilesCount: number;
  honeyfileBreached?: boolean;
}

interface ScoreResponse {
  finalScore: number;
  vaultIntegrityScore: number;
  sessionHygieneScore: number;
  activeThreatScore: number;
  sharingHygieneScore: number;
  deceptionScore: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL';
  metrics: ScoreMetrics;
  evaluatedAt: string;
}

interface AuditLog {
  id: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: any;
}

interface SecurityAlert {
  id: string;
  alertType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  resolved: boolean;
  timestamp: string;
}

interface FailedLoginsTelemetry {
  count: number;
  lastFailedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  failedLogs: AuditLog[];
}

export function SecurityCenter() {
  const { user } = useAuth();

  // State
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [scoreLoading, setScoreLoading] = useState<boolean>(true);

  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState<boolean>(true);

  const [activeAlerts, setActiveAlerts] = useState<SecurityAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);

  const [failedLogins, setFailedLogins] = useState<FailedLoginsTelemetry | null>(null);
  const [failedLoginsLoading, setFailedLoginsLoading] = useState<boolean>(true);

  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState<boolean>(true);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogsCount, setTotalLogsCount] = useState<number>(0);

  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [snapshotLoading, setSnapshotLoading] = useState<boolean>(false);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);

  // Fetch Data
  const fetchScore = async () => {
    setScoreLoading(true);
    try {
      const data = await apiRequest<ScoreResponse>('/api/security-center/score');
      setScore(data);
    } catch {
      setScore(null);
    } finally {
      setScoreLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await apiRequest<{ logs: AuditLog[] }>('/api/security-center/audit-logs?limit=8');
      setRecentActivity(res.logs || []);
    } catch {
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchActiveAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await apiRequest<{ alerts: SecurityAlert[] }>('/api/threats/alerts');
      const unresolved = (res.alerts || []).filter((a) => !a.resolved);
      setActiveAlerts(unresolved);
    } catch {
      setActiveAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchFailedLogins = async () => {
    setFailedLoginsLoading(true);
    try {
      const res = await apiRequest<FailedLoginsTelemetry>('/api/security-center/failed-logins');
      setFailedLogins(res);
    } catch {
      setFailedLogins(null);
    } finally {
      setFailedLoginsLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    setSnapshotsLoading(true);
    try {
      const res = await apiRequest<{ snapshots: any[] }>('/api/security-center/snapshots');
      setSnapshots(res.snapshots || []);
    } catch {
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const fetchAuditLogs = async (page: number = 1) => {
    setLogsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      if (actionFilter) queryParams.append('actionType', actionFilter);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await apiRequest<{
        logs: AuditLog[];
        totalCount: number;
        page: number;
        totalPages: number;
      }>(`/api/security-center/audit-logs?${queryParams.toString()}`);

      setAuditLogs(res.logs || []);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.page || 1);
      setTotalLogsCount(res.totalCount || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setSnapshotLoading(true);
    setSnapshotMsg(null);
    try {
      await apiRequest('/api/security-center/snapshot', { method: 'POST' });
      setSnapshotMsg('Snapshot recorded successfully');
      fetchSnapshots();
      setTimeout(() => setSnapshotMsg(null), 3000);
    } catch (err: any) {
      alert(`Snapshot failed: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const refreshAll = () => {
    fetchScore();
    fetchRecentActivity();
    fetchActiveAlerts();
    fetchFailedLogins();
    fetchSnapshots();
    fetchAuditLogs(1);
  };

  useEffect(() => {
    refreshAll();
  }, [user]);

  const handleFilterChange = (filter: string) => {
    setActionFilter(filter);
    fetchAuditLogs(1);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchAuditLogs(1);
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border-emerald-500/20 font-extrabold';
      case 'GOOD':
        return 'bg-blue-500/10 text-blue-300 dark:text-blue-300 light:text-blue-700 border-blue-500/20 font-extrabold';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-300 dark:text-amber-300 light:text-amber-800 border-amber-500/20 font-extrabold';
      case 'HIGH_RISK':
        return 'bg-orange-500/10 text-orange-400 dark:text-orange-400 light:text-orange-800 border-orange-500/30 font-extrabold';
      default:
        return 'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/20 font-extrabold animate-pulse';
    }
  };

  const getEventSeverityBadge = (actionType: string) => {
    if (
      actionType.includes('FAILED') ||
      actionType.includes('TAMPER') ||
      actionType.includes('HONEYFILE') ||
      actionType.includes('BLOCKED') ||
      actionType.includes('LOCKOUT')
    ) {
      return 'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/30 font-extrabold';
    }
    if (actionType.includes('EXPIRED') || actionType.includes('MFA_REQUIRED') || actionType.includes('UNUSUAL')) {
      return 'bg-amber-500/10 text-amber-300 dark:text-amber-300 light:text-amber-800 border-amber-500/30 font-bold';
    }
    return 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border-emerald-500/20 font-semibold';
  };

  const getEventSeverityLabel = (actionType: string) => {
    if (
      actionType.includes('FAILED') ||
      actionType.includes('TAMPER') ||
      actionType.includes('HONEYFILE') ||
      actionType.includes('BLOCKED') ||
      actionType.includes('LOCKOUT')
    ) {
      return 'CRITICAL';
    }
    if (actionType.includes('EXPIRED') || actionType.includes('MFA_REQUIRED') || actionType.includes('UNUSUAL')) {
      return 'WARNING';
    }
    return 'NORMAL';
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-extrabold animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-extrabold';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30 font-semibold';
    }
  };

  return (
    <div className="space-y-6 font-sans text-white dark:text-white light:text-slate-900">
      {/* ROW 1: Security Posture Score | 5-Vector Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Security Posture Gauge */}
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Security Posture Score
            </span>
            <button
              onClick={refreshAll}
              disabled={scoreLoading}
              className="p-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition cursor-pointer"
              title="Refresh All Security Data"
            >
              <RefreshCw className={`w-4 h-4 ${scoreLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {scoreLoading || !score ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Calculating posture score...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-black text-white dark:text-white light:text-slate-900 tracking-tight flex items-baseline gap-1">
                    {score.finalScore}
                    <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1 font-semibold">Calculated from 5 Real Security Vectors</p>
                </div>

                <span className={`px-3.5 py-1.5 rounded-full text-xs uppercase border ${getRatingBadge(score.rating)}`}>
                  {score.rating.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                  {new Date(score.evaluatedAt).toLocaleTimeString()}
                </span>

                <button
                  onClick={handleSaveSnapshot}
                  disabled={snapshotLoading}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 font-bold rounded-xl border border-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {snapshotLoading ? 'Saving...' : 'Record Snapshot'}
                </button>
              </div>

              {snapshotMsg && <p className="text-[11px] text-emerald-400 font-bold">{snapshotMsg}</p>}
            </div>
          )}
        </div>

        {/* 5-Vector Score Breakdown */}
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> 5-Vector Score Breakdown
          </h4>

          {!score ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Loading vector metrics...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* 1. Integrity */}
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">1. Integrity</span>
                <span className="font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600 text-base">{score.vaultIntegrityScore} / 25</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  {score.metrics.tamperedFiles > 0 ? `Tampered: ${score.metrics.tamperedFiles}` : 'Integrity Verified'}
                </span>
              </div>

              {/* 2. Hygiene */}
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">2. Hygiene</span>
                <span className="font-extrabold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 text-base">{score.sessionHygieneScore} / 25</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  {score.metrics.recentFailedLogins > 0 ? `Failed (7d): ${score.metrics.recentFailedLogins}` : 'Clean Session'}
                </span>
              </div>

              {/* 3. Threats */}
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">3. Threats</span>
                <span className="font-extrabold text-rose-400 dark:text-rose-400 light:text-rose-600 text-base">{score.activeThreatScore} / 20</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  {score.metrics.activeCriticalAlerts > 0 ? `Critical: ${score.metrics.activeCriticalAlerts}` : 'No Active Threats'}
                </span>
              </div>

              {/* 4. Sharing */}
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">4. Sharing</span>
                <span className="font-extrabold text-amber-400 dark:text-amber-400 light:text-amber-700 text-base">{score.sharingHygieneScore} / 15</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  {score.metrics.expiredSharesCount > 0 ? `Expired: ${score.metrics.expiredSharesCount}` : 'Shares Compliant'}
                </span>
              </div>

              {/* 5. Deception */}
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">5. Deception</span>
                <span className="font-extrabold text-purple-400 dark:text-purple-400 light:text-purple-600 text-base">{score.deceptionScore} / 15</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block truncate">
                  {score.metrics.honeyfileBreached ? 'Trap Triggered' : 'Deception Intact'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Dynamic Security Recommendations */}
      {score && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4 font-sans text-white dark:text-white light:text-slate-900">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Security Recommendations &amp; Guidance
          </h4>

          {score.metrics.tamperedFiles === 0 &&
          score.metrics.activeCriticalAlerts === 0 &&
          score.metrics.recentFailedLogins === 0 &&
          score.metrics.expiredSharesCount === 0 &&
          !score.metrics.honeyfileBreached ? (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800 block text-xs">
                  ✓ No Immediate Security Actions Required
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                  Your account security posture is clean and verified across all 5 security vectors. Envelope encryption and telemetry monitoring are active.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {score.metrics.tamperedFiles > 0 && (
                <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300 dark:text-rose-300 light:text-rose-700 block">Tampered Files Detected ({score.metrics.tamperedFiles})</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                      One or more file payload hashes failed integrity checks. Verify file checksums in My Vault.
                    </p>
                  </div>
                </div>
              )}

              {score.metrics.activeCriticalAlerts > 0 && (
                <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300 dark:text-rose-300 light:text-rose-700 block">Critical Threat Alerts Active ({score.metrics.activeCriticalAlerts})</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                      Behavioral monitoring detected threat indicators. Review active security alerts in Threat Monitor.
                    </p>
                  </div>
                </div>
              )}

              {score.metrics.recentFailedLogins > 0 && (
                <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 dark:text-amber-300 light:text-amber-800 block">Review Recent Failed Login Attempts ({score.metrics.recentFailedLogins})</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                      Unsuccessful authentication attempts logged in the last 7 days. Ensure 2FA/OTP is active.
                    </p>
                  </div>
                </div>
              )}

              {score.metrics.expiredSharesCount > 0 && (
                <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 dark:text-amber-300 light:text-amber-800 block">Expired File Shares ({score.metrics.expiredSharesCount})</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                      One or more file share links have reached expiry. Check Shared Files to revoke or extend access window.
                    </p>
                  </div>
                </div>
              )}

              {score.metrics.honeyfileBreached && (
                <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300 dark:text-rose-300 light:text-rose-700 block">Deception Trap Triggered</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                      A honeyfile decoy trap was accessed. Investigate suspicious access in Threat Monitor.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ROW 3: Recent Security Activity & Active Security Alerts (Split Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Recent Security Activity (PART 9) */}
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2 tracking-tight border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3">
              <Clock className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              Recent Security Activity
            </h3>

            {activityLoading ? (
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 py-6 text-center font-medium">Fetching recent events...</p>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">No security activity recorded yet.</p>
                <p className="text-[11px] text-slate-500">Security activity logs will appear here live as actions occur.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentActivity.map((evt) => {
                  const severity = getEventSeverityLabel(evt.actionType);
                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                          {severity === 'CRITICAL' ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          ) : severity === 'WARNING' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white dark:text-white light:text-slate-900 block text-[11px]">
                            {evt.actionType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                            {evt.ipAddress} • {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase border ${getEventSeverityBadge(evt.actionType)}`}>
                        {severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Critical Alerts & Failed Logins (PART 7 & 8) */}
        <div className="space-y-5">
          {/* Active Security Alerts */}
          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm flex items-center justify-between tracking-tight border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Active Security Alerts ({activeAlerts.length})
              </span>
            </h3>

            {alertsLoading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Checking active alerts...</p>
            ) : activeAlerts.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800 block text-xs">
                    ✓ No Active Security Threats
                  </span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                    Your account currently has no active critical security alerts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white dark:text-white light:text-slate-900 text-[11px]">{alert.alertType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase border ${getAlertBadge(alert.riskLevel)}`}>
                        {alert.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">{alert.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">{new Date(alert.timestamp).toLocaleString()} • Status: Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Failed Login Telemetry (PART 8) */}
          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2 tracking-tight border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3">
              <Lock className="w-4 h-4 text-amber-400" /> Failed Login Telemetry (7 Days)
            </h3>

            {failedLoginsLoading ? (
              <p className="text-xs text-slate-400 py-3 text-center">Checking failed login telemetry...</p>
            ) : !failedLogins || failedLogins.count === 0 ? (
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800 block text-xs">
                    ✓ No Recent Failed Login Attempts
                  </span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                    No failed authentication attempts recorded in the last 7 days.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-300 dark:text-amber-300 light:text-amber-800">
                  <span>Failed Login Attempts Detected</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 rounded-md font-mono">{failedLogins.count} Attempt(s)</span>
                </div>
                {failedLogins.lastFailedAt && (
                  <p className="text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700">
                    Last Failed Attempt: <strong className="font-mono text-white dark:text-white light:text-slate-900">{new Date(failedLogins.lastFailedAt).toLocaleString()}</strong>
                  </p>
                )}
                {failedLogins.ipAddress && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Source IP: {failedLogins.ipAddress}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: Security Score History (PART 10) */}
      <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
        <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2 tracking-tight border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3">
          <TrendingUp className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Security Posture History
        </h3>

        {snapshotsLoading ? (
          <p className="text-xs text-slate-400 py-3 text-center">Loading score history snapshots...</p>
        ) : snapshots.length === 0 ? (
          <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-400 text-center font-medium">
            Security score history will appear as activity is recorded.
          </div>
        ) : (
          <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center gap-3 overflow-x-auto font-mono text-xs">
            <span className="text-slate-400 font-bold shrink-0">Score Snapshots:</span>
            {snapshots.map((s, idx) => (
              <div key={s.id || idx} className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-extrabold rounded-lg border border-indigo-500/30">
                  {s.score}
                </span>
                {idx < snapshots.length - 1 && <span className="text-slate-500">→</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROW 5: Audit Log Explorer (PART 13) */}
      <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xl light:shadow-md light:shadow-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
          <div>
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base flex items-center gap-2.5 tracking-tight">
              <Activity className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              Audit Log Explorer ({totalLogsCount})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
              Scoped strictly to your user identity telemetry
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search action or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none transition"
              />
            </form>

            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 focus:outline-none transition cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="FILE_UPLOADED">FILE_UPLOADED</option>
              <option value="FILE_DOWNLOADED">FILE_DOWNLOADED</option>
              <option value="FILE_DELETED">FILE_DELETED</option>
              <option value="FILE_SHARED">FILE_SHARED</option>
              <option value="HONEYFILE_ACCESSED">HONEYFILE_ACCESSED</option>
              <option value="FILE_TAMPER_DETECTED">FILE_TAMPER_DETECTED</option>
              <option value="STEP_UP_MFA_SUCCESS">STEP_UP_MFA_SUCCESS</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        {logsLoading ? (
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 text-center py-8 font-medium">Fetching audit telemetry records...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 text-center py-8 font-semibold">No audit logs found matching query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
              <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Device / User Agent</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100 transition-all">
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${getEventSeverityBadge(log.actionType)}`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 dark:text-slate-200 light:text-slate-800 font-semibold">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-slate-400 light:text-slate-600 truncate max-w-xs">{log.userAgent}</td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pt-4 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
          <span>
            Page <strong className="text-white dark:text-white light:text-slate-900">{currentPage}</strong> of <strong className="text-white dark:text-white light:text-slate-900">{totalPages}</strong> (Limit: 10, Max: 50)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(currentPage - 1)}
              disabled={currentPage <= 1 || logsLoading}
              className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-300 light:text-slate-700" />
            </button>
            <button
              onClick={() => fetchAuditLogs(currentPage + 1)}
              disabled={currentPage >= totalPages || logsLoading}
              className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-300 light:text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

