import { useState, useEffect, FormEvent } from 'react';
import { apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { AnomalyMonitorWidget } from './AnomalyMonitorWidget';
import {
  Activity,
  Search,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle2,
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
}

interface ScoreBreakdown {
  evaluatedAt: string;
  vaultIntegrityScore: number;
  sessionHygieneScore: number;
  activeThreatScore: number;
  sharingHygieneScore: number;
  deceptionScore: number;
  finalScore: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL_RISK';
  metrics: ScoreMetrics;
}

interface AuditLogItem {
  id: string;
  actionType: string;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata: any;
}

interface AuditLogsResponse {
  logs: AuditLogItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminOverview {
  totalUsers: number;
  lockedAccountsCount: number;
  tamperedFilesCount: number;
  alertsBySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  honeyfilesCount: number;
  suspiciousEventsCount: number;
  systemIntegrityStatus: string;
}

export function SecurityCenter() {
  const { user } = useAuth();
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logsLoading, setLogsLoading] = useState(true);

  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  const fetchScore = async () => {
    setScoreLoading(true);
    try {
      const data = await apiRequest<ScoreBreakdown>('/api/security-center/score');
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
      await apiRequest('/api/security-center/snapshot', { method: 'POST' });
      setSnapshotMsg('Historical score snapshot recorded successfully.');
    } catch (err: any) {
      setSnapshotMsg(`Snapshot failed: ${err.message}`);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const fetchAuditLogs = async (page: number = 1) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (actionFilter) params.append('actionType', actionFilter);
      if (searchQuery) params.append('search', searchQuery);

      const data = await apiRequest<AuditLogsResponse>(`/api/security-center/audit-logs?${params.toString()}`);
      setAuditLogs(data.logs);
      setTotalLogsCount(data.totalCount);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      // Ignore
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchAdminOverview = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const data = await apiRequest<AdminOverview>('/api/security-center/admin/overview');
      setAdminOverview(data);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchScore();
    fetchAuditLogs(1);
    fetchAdminOverview();
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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.3)] font-extrabold tracking-wider';
      case 'GOOD':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-extrabold tracking-wider';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-extrabold tracking-wider';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse font-extrabold tracking-wider';
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Score Gauge Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-4 transition-all duration-300 hover:border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> POSTURE SCORE HUD
            </span>
            <button
              onClick={fetchScore}
              disabled={scoreLoading}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 transition hover:scale-110 active:scale-95"
              title="Refresh Deterministic Score"
            >
              <RefreshCw className={`w-4 h-4 ${scoreLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {scoreLoading || !score ? (
            <p className="text-xs text-cyan-400/80 tracking-wider">CALCULATING DETERMINISTIC POSTURE SCORE...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                    {score.finalScore}
                    <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-semibold">Deterministic 5-Vector Score</p>
                </div>

                <span className={`px-3.5 py-1.5 rounded-xl text-xs uppercase border ${getRatingBadge(score.rating)}`}>
                  {score.rating}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {new Date(score.evaluatedAt).toLocaleTimeString()}
                </span>

                <button
                  onClick={handleSaveSnapshot}
                  disabled={snapshotLoading}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 font-bold rounded-xl border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {snapshotLoading ? 'RECORDING...' : 'RECORD SNAPSHOT'}
                </button>
              </div>

              {snapshotMsg && <p className="text-[11px] text-emerald-400 font-bold tracking-wide">{snapshotMsg}</p>}
            </div>
          )}
        </div>

        {/* Vector Metrics Breakdown */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] col-span-2 space-y-4 transition-all duration-300 hover:border-cyan-500/30">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> 5-VECTOR SCORE BREAKDOWN
          </h4>

          {!score ? (
            <p className="text-xs text-cyan-400/80 tracking-wider">LOADING VECTOR METRICS...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1 hover:border-emerald-500/40 transition-all shadow-inner">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">1. Integrity</span>
                <span className="font-extrabold text-emerald-300 text-base">{score.vaultIntegrityScore} / 25</span>
                <span className="text-[10px] text-slate-400 block">Tampered: {score.metrics.tamperedFiles}</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1 hover:border-cyan-500/40 transition-all shadow-inner">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">2. Hygiene</span>
                <span className="font-extrabold text-cyan-300 text-base">{score.sessionHygieneScore} / 25</span>
                <span className="text-[10px] text-slate-400 block">Failed (7d): {score.metrics.recentFailedLogins}</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1 hover:border-rose-500/40 transition-all shadow-inner">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">3. Threats</span>
                <span className="font-extrabold text-rose-300 text-base">{score.activeThreatScore} / 20</span>
                <span className="text-[10px] text-slate-400 block">Critical: {score.metrics.activeCriticalAlerts}</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1 hover:border-amber-500/40 transition-all shadow-inner">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">4. Sharing</span>
                <span className="font-extrabold text-amber-300 text-base">{score.sharingHygieneScore} / 15</span>
                <span className="text-[10px] text-slate-400 block">Expired: {score.metrics.expiredSharesCount}</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1 hover:border-purple-500/40 transition-all shadow-inner">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">5. Deception</span>
                <span className="font-extrabold text-purple-300 text-base">{score.deceptionScore} / 15</span>
                <span className="text-[10px] text-slate-400 block">Honeyfiles: {score.metrics.honeyfilesCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Security Overview (If Admin) */}
      {user?.role === 'ADMIN' && adminOverview && (
        <div className="p-6 bg-gradient-to-r from-slate-900/60 via-indigo-950/40 to-slate-900/60 border border-cyan-500/40 rounded-3xl backdrop-blur-xl shadow-[0_0_35px_rgba(99,102,241,0.2)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> SYSTEM AGGREGATE SECURITY METADATA (ADMIN)
            </h4>
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Rule #9 Verified (Zero Private Decrypt Access)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Users</span>
              <span className="font-extrabold text-white text-base">{adminOverview.totalUsers}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Locked Accounts</span>
              <span className="font-extrabold text-amber-300 text-base">{adminOverview.lockedAccountsCount}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Tampered Files</span>
              <span className={`font-extrabold text-base ${adminOverview.tamperedFilesCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                {adminOverview.tamperedFilesCount}
              </span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Critical Alerts</span>
              <span className="font-extrabold text-rose-400 text-base">{adminOverview.alertsBySeverity.CRITICAL}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Honeyfiles</span>
              <span className="font-extrabold text-purple-300 text-base">{adminOverview.honeyfilesCount}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Suspicious Events</span>
              <span className="font-extrabold text-amber-300 text-base">{adminOverview.suspiciousEventsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Behavioral Anomaly Monitor Widget */}
      <AnomalyMonitorWidget />

      {/* Audit Log Explorer */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2.5 tracking-tight">
              <Activity className="w-5 h-5 text-cyan-400" />
              AUDIT LOG EXPLORER ({totalLogsCount})
            </h3>
            <p className="text-xs text-slate-400">Scoped strictly to your user identity with safe text search</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search action or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </form>

            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
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
          <p className="text-xs text-cyan-400/80 text-center py-8 tracking-wider">FETCHING AUDIT TELEMETRY RECORDS...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 font-semibold">No audit logs found matching query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Device / User Agent</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-all duration-300">
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${
                          log.actionType.includes('FAILED') || log.actionType.includes('TAMPER') || log.actionType.includes('HONEYFILE')
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-semibold">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">{log.userAgent}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400 font-mono">
          <span>
            Page <strong className="text-cyan-300">{currentPage}</strong> of <strong className="text-slate-200">{totalPages}</strong> (Limit: 10, Max: 50)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(currentPage - 1)}
              disabled={currentPage <= 1 || logsLoading}
              className="p-2 bg-slate-950/80 border border-white/10 rounded-xl hover:bg-slate-800 transition hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => fetchAuditLogs(currentPage + 1)}
              disabled={currentPage >= totalPages || logsLoading}
              className="p-2 bg-slate-950/80 border border-white/10 rounded-xl hover:bg-slate-800 transition hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
