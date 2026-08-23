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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface ScoreMetrics {
  totalFiles: number;
  tamperedFiles: number;
  recentFailedLogins: number;
  activeCriticalAlerts: number;
  expiredSharesCount: number;
  honeyfilesCount: number;
}

interface ScoreResponse {
  finalScore: number;
  vaultIntegrityScore: number;
  sessionHygieneScore: number;
  activeThreatScore: number;
  sharingHygieneScore: number;
  deceptionScore: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL_RISK';
  metrics: ScoreMetrics;
  evaluatedAt: string;
}

interface AuditLog {
  id: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export function SecurityCenter() {
  const { user } = useAuth();
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [scoreLoading, setScoreLoading] = useState<boolean>(true);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogsCount, setTotalLogsCount] = useState<number>(0);

  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [snapshotLoading, setSnapshotLoading] = useState<boolean>(false);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);

  const fetchScore = async () => {
    setScoreLoading(true);
    try {
      const data = await apiRequest<ScoreResponse>('/api/security-center/score');
      setScore(data);
    } catch (err) {
      // Ignore
    } finally {
      setScoreLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setSnapshotLoading(true);
    setSnapshotMsg(null);
    try {
      await apiRequest('/api/security-center/snapshots', { method: 'POST' });
      setSnapshotMsg('Snapshot recorded successfully');
      setTimeout(() => setSnapshotMsg(null), 3000);
    } catch (err: any) {
      alert(`Snapshot failed: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
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
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/security-center/audit-logs?${queryParams.toString()}`);

      setAuditLogs(res.logs);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.page || 1);
      setTotalLogsCount(res.total || 0);
    } catch (err) {
      // Ignore
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    fetchAuditLogs(1);
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
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-extrabold';
      case 'GOOD':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20 font-extrabold';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20 font-extrabold';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-extrabold animate-pulse';
    }
  };

  return (
    <div className="space-y-6 font-sans text-white dark:text-white light:text-slate-900">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Score Gauge Card */}
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Security Posture
            </span>
            <button
              onClick={fetchScore}
              disabled={scoreLoading}
              className="p-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition cursor-pointer"
              title="Refresh Score"
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
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1 font-semibold">Deterministic 5-Vector Score</p>
                </div>

                <span className={`px-3.5 py-1.5 rounded-full text-xs uppercase border ${getRatingBadge(score.rating)}`}>
                  {score.rating}
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

        {/* Vector Metrics Breakdown */}
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> 5-Vector Score Breakdown
          </h4>

          {!score ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Loading vector metrics...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">1. Integrity</span>
                <span className="font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600 text-base">{score.vaultIntegrityScore} / 25</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block">Tampered: {score.metrics.tamperedFiles}</span>
              </div>

              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">2. Hygiene</span>
                <span className="font-extrabold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 text-base">{score.sessionHygieneScore} / 25</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block">Failed (7d): {score.metrics.recentFailedLogins}</span>
              </div>

              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">3. Threats</span>
                <span className="font-extrabold text-rose-400 dark:text-rose-400 light:text-rose-600 text-base">{score.activeThreatScore} / 20</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block">Critical: {score.metrics.activeCriticalAlerts}</span>
              </div>

              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">4. Sharing</span>
                <span className="font-extrabold text-amber-400 dark:text-amber-400 light:text-amber-700 text-base">{score.sharingHygieneScore} / 15</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block">Expired: {score.metrics.expiredSharesCount}</span>
              </div>

              <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block text-[10px] font-bold uppercase">5. Deception</span>
                <span className="font-extrabold text-purple-400 dark:text-purple-400 light:text-purple-600 text-base">{score.deceptionScore} / 15</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block">Honeyfiles: {score.metrics.honeyfilesCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Recommendations */}
      {score && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4 font-sans text-white dark:text-white light:text-slate-900">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Security Recommendations &amp; Posture Guidance
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {score.metrics.tamperedFiles > 0 ? (
              <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300 dark:text-rose-300 light:text-rose-700 block">Tampered Files Detected ({score.metrics.tamperedFiles})</span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                    One or more file payload hashes failed integrity checks. Verify file integrity in My Vault or re-upload your originals.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800 block">Vault Cryptographic Integrity Verified</span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                    All stored objects match SHA-256 payload checksums. AES-256-GCM envelope encryption is intact.
                  </p>
                </div>
              </div>
            )}

            {score.metrics.activeCriticalAlerts > 0 ? (
              <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300 dark:text-rose-300 light:text-rose-700 block">Critical Threat Alerts Active ({score.metrics.activeCriticalAlerts})</span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                    Behavioral monitoring detected potential threat indicators. Navigate to Threat Monitor to review detailed security alerts.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 dark:text-emerald-300 light:text-emerald-800 block">Behavioral Baseline Clean</span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                    No active critical brute-force or burst access threats detected in real-time telemetry.
                  </p>
                </div>
              </div>
            )}

            {score.metrics.recentFailedLogins > 0 && (
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 dark:text-amber-300 light:text-amber-800 block">Failed Login Attempts ({score.metrics.recentFailedLogins})</span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed">
                    Unsuccessful authentication attempts logged in the last 7 days. Ensure 2FA/OTP settings are active.
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
          </div>
        </div>
      )}

      {/* Audit Log Explorer */}
      <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xl light:shadow-md light:shadow-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
          <div>
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base flex items-center gap-2.5 tracking-tight">
              <Activity className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              Audit Log Explorer ({totalLogsCount})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Scoped strictly to your user identity telemetry</p>
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
                        className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${
                          log.actionType.includes('FAILED') || log.actionType.includes('TAMPER') || log.actionType.includes('HONEYFILE')
                            ? 'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border-indigo-500/30'
                        }`}
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
