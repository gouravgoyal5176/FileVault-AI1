import { useState, useEffect, FormEvent } from 'react';
import { apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Activity,
  Clock,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { AnomalyMonitorWidget } from './AnomalyMonitorWidget';

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

interface AdminOverview {
  totalUsers: number;
  totalFiles: number;
  lockedAccountsCount: number;
  tamperedFilesCount: number;
  honeyfilesCount: number;
  suspiciousEventsCount: number;
  alertsBySeverity: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
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

  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold';
      case 'GOOD':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold';
      case 'MODERATE':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Score Gauge Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" /> Security Posture
            </span>
            <button
              onClick={fetchScore}
              disabled={scoreLoading}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="Refresh Score"
            >
              <RefreshCw className={`w-4 h-4 ${scoreLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {scoreLoading || !score ? (
            <p className="text-xs text-slate-400 font-medium">Calculating posture score...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                    {score.finalScore}
                    <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">Deterministic 5-Vector Score</p>
                </div>

                <span className={`px-3.5 py-1.5 rounded-full text-xs uppercase border ${getRatingBadge(score.rating)}`}>
                  {score.rating}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {new Date(score.evaluatedAt).toLocaleTimeString()}
                </span>

                <button
                  onClick={handleSaveSnapshot}
                  disabled={snapshotLoading}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {snapshotLoading ? 'Saving...' : 'Record Snapshot'}
                </button>
              </div>

              {snapshotMsg && <p className="text-[11px] text-emerald-600 font-bold">{snapshotMsg}</p>}
            </div>
          )}
        </div>

        {/* Vector Metrics Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm col-span-2 space-y-4 transition-all hover:shadow-md">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" /> 5-Vector Score Breakdown
          </h4>

          {!score ? (
            <p className="text-xs text-slate-400 font-medium">Loading vector metrics...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">1. Integrity</span>
                <span className="font-extrabold text-emerald-700 text-base">{score.vaultIntegrityScore} / 25</span>
                <span className="text-[10px] text-slate-500 block">Tampered: {score.metrics.tamperedFiles}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">2. Hygiene</span>
                <span className="font-extrabold text-indigo-600 text-base">{score.sessionHygieneScore} / 25</span>
                <span className="text-[10px] text-slate-500 block">Failed (7d): {score.metrics.recentFailedLogins}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">3. Threats</span>
                <span className="font-extrabold text-rose-600 text-base">{score.activeThreatScore} / 20</span>
                <span className="text-[10px] text-slate-500 block">Critical: {score.metrics.activeCriticalAlerts}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">4. Sharing</span>
                <span className="font-extrabold text-amber-600 text-base">{score.sharingHygieneScore} / 15</span>
                <span className="text-[10px] text-slate-500 block">Expired: {score.metrics.expiredSharesCount}</span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">5. Deception</span>
                <span className="font-extrabold text-purple-600 text-base">{score.deceptionScore} / 15</span>
                <span className="text-[10px] text-slate-500 block">Honeyfiles: {score.metrics.honeyfilesCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Security Overview (If Admin) */}
      {user?.role === 'ADMIN' && adminOverview && (
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" /> SYSTEM AGGREGATE SECURITY METADATA (ADMIN ONLY)
            </h4>
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Rule #9 Verified
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Total Users</span>
              <span className="font-extrabold text-white text-base">{adminOverview.totalUsers}</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Locked Accounts</span>
              <span className="font-extrabold text-amber-300 text-base">{adminOverview.lockedAccountsCount}</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Tampered Files</span>
              <span className={`font-extrabold text-base ${adminOverview.tamperedFilesCount > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {adminOverview.tamperedFilesCount}
              </span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Critical Alerts</span>
              <span className="font-extrabold text-rose-400 text-base">{adminOverview.alertsBySeverity.CRITICAL}</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Honeyfiles</span>
              <span className="font-extrabold text-purple-300 text-base">{adminOverview.honeyfilesCount}</span>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10">
              <span className="text-indigo-200 block text-[10px] font-bold uppercase">Suspicious Events</span>
              <span className="font-extrabold text-amber-300 text-base">{adminOverview.suspiciousEventsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Behavioral Anomaly Monitor Widget */}
      <AnomalyMonitorWidget />

      {/* Audit Log Explorer */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2.5 tracking-tight">
              <Activity className="w-5 h-5 text-indigo-600" />
              Audit Log Explorer ({totalLogsCount})
            </h3>
            <p className="text-xs text-slate-500 font-medium">Scoped strictly to your user identity with safe text search</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search action or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </form>

            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-800 focus:outline-none transition cursor-pointer"
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
          <p className="text-xs text-slate-400 text-center py-8 font-medium">Fetching audit telemetry records...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8 font-semibold">No audit logs found matching query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Device / User Agent</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${
                          log.actionType.includes('FAILED') || log.actionType.includes('TAMPER') || log.actionType.includes('HONEYFILE')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{log.userAgent}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> (Limit: 10, Max: 50)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(currentPage - 1)}
              disabled={currentPage <= 1 || logsLoading}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => fetchAuditLogs(currentPage + 1)}
              disabled={currentPage >= totalPages || logsLoading}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
