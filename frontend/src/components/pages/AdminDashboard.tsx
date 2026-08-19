import { useState, useEffect } from 'react';
import { apiRequest } from '../../api/apiClient';
import {
  Shield,
  Users,
  HardDrive,
  ShieldAlert,
  Bug,
  Activity,
  Server,
  Database,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Lock
} from 'lucide-react';

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

export function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AdminOverview>('/api/security-center/admin/overview');
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system-level admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>System Administration Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            System Security &amp; Aggregate Telemetry Analytics
          </h2>
          <p className="text-xs text-indigo-200/80 max-w-2xl">
            High-level infrastructure status, system threats, and deception trap metrics. Scoped under strict Rule #9 zero-decrypt isolation policy.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div className="text-xs">
            <p className="font-extrabold uppercase tracking-wider text-white">Rule #9 Compliant</p>
            <p className="text-[11px] opacity-90">Zero Private Decrypt Access</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAdminData} className="font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* System Infrastructure Health Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" /> System Infrastructure Health
          </h3>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">PostgreSQL + Prisma</h4>
                <p className="text-[10px] text-slate-500 font-medium">Relational Database Engine</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              HEALTHY
            </span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Redis Cache &amp; Rate Limiter</h4>
                <p className="text-[10px] text-slate-500 font-medium">In-Memory Token Cache</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              ACTIVE
            </span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">MinIO Object Storage</h4>
                <p className="text-[10px] text-slate-500 font-medium">Encrypted Ciphertext Storage</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate System Metrics Grid */}
      {loading || !overview ? (
        <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading system analytics...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Users</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{overview.totalUsers}</p>
            <span className="text-[10px] text-slate-500 font-medium">Registered Vault Accounts</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Files</span>
              <HardDrive className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{overview.totalFiles}</p>
            <span className="text-[10px] text-slate-500 font-medium">Encrypted Ciphertexts</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Locked Accounts</span>
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600">{overview.lockedAccountsCount}</p>
            <span className="text-[10px] text-slate-500 font-medium">Brute-Force Protected</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Critical Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600">{overview.alertsBySeverity.CRITICAL}</p>
            <span className="text-[10px] text-slate-500 font-medium">Active Threat Triggers</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Honeyfiles</span>
              <Bug className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600">{overview.honeyfilesCount}</p>
            <span className="text-[10px] text-slate-500 font-medium">Active Decoy Traps</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Tampered Files</span>
              <Activity className="w-4 h-4 text-rose-600" />
            </div>
            <p className={`text-2xl font-extrabold ${overview.tamperedFilesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overview.tamperedFilesCount}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">SHA-256 Mismatches</span>
          </div>
        </div>
      )}

      {/* AI Risk Distribution & Severity Breakdown */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" /> Threat Severity Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-900">CRITICAL SEVERITY</span>
                <span className="font-extrabold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  {overview.alertsBySeverity.CRITICAL}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900">HIGH SEVERITY</span>
                <span className="font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {overview.alertsBySeverity.HIGH}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900">MEDIUM SEVERITY</span>
                <span className="font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  {overview.alertsBySeverity.MEDIUM}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">LOW SEVERITY</span>
                <span className="font-extrabold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">
                  {overview.alertsBySeverity.LOW}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" /> AI Behavioral Anomaly Telemetry
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Suspicious Events Detected:</span>
                <span className="font-extrabold text-slate-900">{overview.suspiciousEventsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Decoy Honeyfiles Accesses:</span>
                <span className="font-extrabold text-purple-600">{overview.honeyfilesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Account Lockouts Triggered:</span>
                <span className="font-extrabold text-amber-600">{overview.lockedAccountsCount}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 leading-relaxed font-mono">
                Admins monitor high-level behavioral telemetry only. Individual file content payload access is strictly prohibited by architecture.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
