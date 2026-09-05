import { useState, useEffect } from 'react';
import { apiRequest } from '../../api/apiClient';
import {
  Shield,
  ShieldCheck,
  Users,
  HardDrive,
  Search,
  RefreshCw,
  UserX,
  UserCheck,
  Trash2,
  KeyRound,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe,
  LifeBuoy,
  LayoutDashboard,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  googleUsers: number;
  localUsers: number;
  hybridUsers: number;
  totalFiles: number;
  totalShares: number;
  activeAlerts: number;
}

interface AdminUserItem {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  authProvider: 'LOCAL' | 'GOOGLE' | 'HYBRID';
  emailVerified: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  _count: {
    ownedFiles: number;
    sharesGiven: number;
    sharesReceived: number;
  };
}

interface UserDetailData {
  user: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'SUSPENDED';
    authProvider: 'LOCAL' | 'GOOGLE' | 'HYBRID';
    emailVerified: boolean;
    failedLoginAttempts: number;
    lockoutUntil: string | null;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    lastLoginUserAgent: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      ownedFiles: number;
      sharesGiven: number;
      sharesReceived: number;
      securityAlerts: number;
      activityLogs: number;
    };
  };
  recentLogs: Array<{
    id: string;
    actionType: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    metadata?: any;
  }>;
}

interface AdminDashboardProps {
  activeSection?: string;
  setActiveSection?: (section: any) => void;
  adminSearchQuery?: string;
}

export function AdminDashboard({
  activeSection: propActiveSection,
  setActiveSection: propSetActiveSection,
  adminSearchQuery,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Sync with navbar search if provided
  useEffect(() => {
    if (adminSearchQuery !== undefined) {
      setSearch(adminSearchQuery);
    }
  }, [adminSearchQuery]);

  // Modals & Active Selections
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Active Section State
  const [internalSection, setInternalSection] = useState<'users' | 'audit' | 'security' | 'support' | 'overview' | 'system' | 'adaptive'>('overview');

  // Derive current section from prop if provided
  const activeSection = (function() {
    if (!propActiveSection) return internalSection;
    if (propActiveSection === 'admin-overview') return 'overview';
    if (propActiveSection === 'admin-users') return 'users';
    if (propActiveSection === 'admin-security') return 'security';
    if (propActiveSection === 'admin-logs') return 'audit';
    if (propActiveSection === 'admin-support') return 'support';
    if (propActiveSection === 'admin-system') return 'system';
    if (propActiveSection === 'admin-adaptive' || propActiveSection === 'adaptive') return 'adaptive';
    return internalSection;
  })();

  const changeSection = (sec: 'users' | 'audit' | 'security' | 'support' | 'overview' | 'system' | 'adaptive') => {
    if (propSetActiveSection) {
      if (sec === 'overview') propSetActiveSection('admin-overview');
      else if (sec === 'users') propSetActiveSection('admin-users');
      else if (sec === 'security') propSetActiveSection('admin-security');
      else if (sec === 'audit') propSetActiveSection('admin-logs');
      else if (sec === 'support') propSetActiveSection('admin-support');
      else if (sec === 'system') propSetActiveSection('admin-system');
      else if (sec === 'adaptive') propSetActiveSection('admin-adaptive');
    } else {
      setInternalSection(sec);
    }
  };

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [adaptiveDecisions, setAdaptiveDecisions] = useState<any[]>([]);
  const [adaptiveLoading, setAdaptiveLoading] = useState<boolean>(false);

  const fetchAdminAdaptiveDecisions = async () => {
    setAdaptiveLoading(true);
    try {
      const res = await apiRequest<{ decisions: any[] }>('/api/admin/adaptive-decisions');
      setAdaptiveDecisions(res.decisions || []);
    } catch {
      setAdaptiveDecisions([]);
    } finally {
      setAdaptiveLoading(false);
    }
  };

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState<boolean>(false);
  const [supportStatusFilter, setSupportStatusFilter] = useState<string>('ALL');

  // Debounce search keystrokes (~300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [systemHealth, setSystemHealth] = useState<any>(null);

  const fetchSystemHealth = async () => {
    try {
      const res = await apiRequest<any>('/api/health');
      setSystemHealth(res);
    } catch {
      setSystemHealth(null);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await apiRequest<AdminStats>('/api/admin/stats');
      setStats(statsRes);

      let queryStr = `/api/admin/users?`;
      if (debouncedSearch.trim()) queryStr += `search=${encodeURIComponent(debouncedSearch.trim())}&`;
      if (providerFilter !== 'ALL') queryStr += `provider=${providerFilter}&`;
      if (statusFilter !== 'ALL') queryStr += `status=${statusFilter}&`;
      if (roleFilter !== 'ALL') queryStr += `role=${roleFilter}&`;

      const usersRes = await apiRequest<{ users: AdminUserItem[] }>(queryStr);
      setUsers(usersRes.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load system admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminAuditLogs = async () => {
    setAuditLoading(true);
    try {
      let q = `/api/admin/audit-logs?limit=25`;
      if (auditSearch.trim()) q += `&search=${encodeURIComponent(auditSearch.trim())}`;
      const res = await apiRequest<{ logs: any[]; totalCount: number }>(q);
      setAuditLogs(res.logs || []);
      setAuditTotal(res.totalCount || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchAdminSecurityAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await apiRequest<{ alerts: any[] }>('/api/admin/security-alerts');
      setSecurityAlerts(res.alerts || []);
    } catch {
      setSecurityAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchAdminSupportTickets = async () => {
    setSupportLoading(true);
    try {
      let q = `/api/support/admin/tickets?limit=50`;
      if (supportStatusFilter !== 'ALL') q += `&status=${supportStatusFilter}`;
      const res = await apiRequest<{ tickets: any[] }>(q);
      setSupportTickets(res.tickets || []);
    } catch {
      setSupportTickets([]);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiRequest(`/api/support/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setActionMessage(`Ticket #${ticketId.substring(0, 8)} status updated to ${newStatus}.`);
      fetchAdminSupportTickets();
    } catch (err: any) {
      alert(`Failed to update ticket status: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchAdminSupportTickets();
    fetchAdminAuditLogs();
    fetchAdminSecurityAlerts();
    fetchSystemHealth();
  }, [activeSection, debouncedSearch, providerFilter, statusFilter, roleFilter, supportStatusFilter, auditSearch]);

  const handleOpenUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    try {
      const data = await apiRequest<UserDetailData>(`/api/admin/users/${userId}`);
      setUserDetail(data);
    } catch (err: any) {
      alert(`Failed to load user details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleSuspend = async (userItem: AdminUserItem) => {
    const isSuspending = userItem.status === 'ACTIVE';
    const actionLabel = isSuspending ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${actionLabel} account: ${userItem.email}?`)) return;

    setActionLoading(true);
    try {
      const endpoint = `/api/admin/users/${userItem.id}/${isSuspending ? 'suspend' : 'activate'}`;
      await apiRequest(endpoint, { method: 'PATCH' });
      setActionMessage(`User '${userItem.email}' account status updated to ${isSuspending ? 'SUSPENDED' : 'ACTIVE'}.`);
      fetchAdminData();
      if (selectedUserId === userItem.id) {
        handleOpenUserDetail(userItem.id);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async (userItem: AdminUserItem) => {
    if (!confirm(`Revoke all active sessions and refresh tokens for ${userItem.email}?`)) return;

    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/users/${userItem.id}/revoke-sessions`, { method: 'POST' });
      setActionMessage(`All active sessions revoked for ${userItem.email}.`);
      fetchAdminData();
    } catch (err: any) {
      alert(`Session revocation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAccount = async (userItem: AdminUserItem) => {
    if (!confirm(`Reset account counters, lockout, and invalid sessions for ${userItem.email}?`)) return;

    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/users/${userItem.id}/reset`, { method: 'POST' });
      setActionMessage(`Account reset completed successfully for ${userItem.email}.`);
      fetchAdminData();
    } catch (err: any) {
      alert(`Account reset failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async (userItem: AdminUserItem) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/users/${userItem.id}`, { method: 'DELETE' });
      setActionMessage(`User account '${userItem.email}' permanently deleted. The email is now available for fresh registration.`);
      setDeleteConfirmUser(null);
      if (selectedUserId === userItem.id) {
        setSelectedUserId(null);
        setUserDetail(null);
      }
      fetchAdminData();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 select-none font-sans text-white dark:text-white light:text-slate-900">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 light:from-indigo-900 light:via-indigo-950 light:to-purple-950 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            User Account Management &amp; System Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Monitor all registered vault accounts, authentication identities, active sessions, and perform administrator account management actions.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-5 py-3.5 rounded-2xl flex items-center gap-3.5 shrink-0 backdrop-blur-md z-10">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div className="text-xs">
            <p className="font-extrabold uppercase tracking-wider text-white">Rule #9 Isolation</p>
            <p className="text-[11px] text-emerald-200/80">Zero Cryptographic Secret Exposure</p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => changeSection('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => changeSection('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => {
            changeSection('audit');
            fetchAdminAuditLogs();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'audit'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => {
            changeSection('security');
            fetchAdminSecurityAlerts();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'security'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Security Alerts</span>
        </button>

        <button
          onClick={() => {
            changeSection('adaptive');
            fetchAdminAdaptiveDecisions();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'adaptive'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Adaptive Security</span>
        </button>

        <button
          onClick={() => {
            changeSection('support');
            fetchAdminSupportTickets();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'support'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets</span>
        </button>

        <button
          onClick={() => changeSection('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'system'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>System Health</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-200 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 dark:text-emerald-400 light:text-emerald-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 cursor-pointer font-bold">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/80 dark:bg-rose-950/80 light:bg-rose-50 border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 text-rose-300 dark:text-rose-300 light:text-rose-800 text-xs rounded-2xl flex items-center justify-between shadow-lg">
          <span>{error}</span>
          <button onClick={fetchAdminData} className="font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* System Overview Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Total Registered</span>
              <Users className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900">{stats.totalUsers}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">All System Accounts</span>
          </div>

          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Active Accounts</span>
              <UserCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-400 light:text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600">{stats.activeUsers}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">Fully Operational</span>
          </div>

          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Suspended Users</span>
              <UserX className="w-4 h-4 text-rose-400 dark:text-rose-400 light:text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-rose-400 dark:text-rose-400 light:text-rose-600">{stats.suspendedUsers}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">Access Blocked</span>
          </div>

          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Verified Emails</span>
              <ShieldCheck className="w-4 h-4 text-teal-400 dark:text-teal-400 light:text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-teal-300 dark:text-teal-300 light:text-teal-700">{stats.verifiedUsers}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">OTP / OAuth Verified</span>
          </div>

          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Google OAuth</span>
              <Globe className="w-4 h-4 text-blue-400 dark:text-blue-400 light:text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-400 dark:text-blue-400 light:text-blue-600">{stats.googleUsers + stats.hybridUsers}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">Google Sign-In Accounts</span>
          </div>

          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-xl light:shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 light:text-slate-500">Encrypted Files</span>
              <HardDrive className="w-4 h-4 text-purple-400 dark:text-purple-400 light:text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-300 dark:text-purple-300 light:text-purple-700">{stats.totalFiles}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500">Stored MinIO Objects</span>
          </div>
        </div>
      )}

      {/* User Management Section */}
      {activeSection === 'users' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
        {/* Controls & Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Registered Vault Accounts</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Filter, inspect, manage, and delete user accounts</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 light:text-slate-500" />
              <input
                type="text"
                placeholder="Search email, user ID, Google ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 light:text-slate-500 hover:text-white dark:hover:text-white light:hover:text-slate-900 p-0.5 rounded cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">All Providers</option>
              <option value="LOCAL">LOCAL (Password)</option>
              <option value="GOOGLE">GOOGLE (OAuth)</option>
              <option value="HYBRID">HYBRID (Linked)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
              title="Refresh User Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 tracking-wider bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100">
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Files</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono">
                    Fetching user registry from database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-medium">
                    {search ? `No users found for "${search}"` : 'No registered user accounts match the selected criteria.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100 transition group">
                    <td className="py-3.5 px-4 font-mono font-medium text-white dark:text-white light:text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 dark:text-amber-400 light:text-amber-800">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300">
                        {u.authProvider}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/30' : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-700 border border-slate-700 dark:border-slate-700 light:border-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 border border-rose-500/30 text-rose-400 dark:text-rose-400 light:text-rose-700">
                          SUSPENDED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300 dark:text-slate-300 light:text-slate-800">
                      {u._count.ownedFiles}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="p-1.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition cursor-pointer"
                          title="Inspect Details"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'text-amber-400 dark:text-amber-400 light:text-amber-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-emerald-400 dark:text-emerald-400 light:text-emerald-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                        >
                          {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleRevokeSessions(u)}
                          disabled={actionLoading}
                          className="p-1.5 text-purple-400 dark:text-purple-400 light:text-purple-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition cursor-pointer"
                          title="Revoke Sessions"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          disabled={actionLoading}
                          className="p-1.5 text-rose-400 dark:text-rose-400 light:text-rose-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Audit Logs Section */}
      {activeSection === 'audit' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">System Security Audit Logs</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Total Recorded Entries: {auditTotal}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 light:text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter logs by email/IP..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAdminAuditLogs()}
                  className="w-full bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                onClick={fetchAdminAuditLogs}
                disabled={auditLoading}
                className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 dark:text-slate-300 light:text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 tracking-wider bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100">
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">User Agent</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                {auditLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono">Loading system audit logs...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-medium">No audit logs found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300 dark:text-indigo-300 light:text-indigo-700">{log.actionType}</td>
                      <td className="py-3 px-4 font-mono text-slate-200 dark:text-slate-200 light:text-slate-900 font-semibold">{log.user?.email || 'ANONYMOUS'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-400 light:text-slate-600">{log.ipAddress}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-500 light:text-slate-600 truncate max-w-[200px]">{log.userAgent}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 dark:text-slate-400 light:text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Threat Alerts Section */}
      {activeSection === 'security' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 text-rose-400 dark:text-rose-400 light:text-rose-600 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Security Threat Alerts</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">System-wide active &amp; historical threat detection events</p>
              </div>
            </div>

            <button
              onClick={fetchAdminSecurityAlerts}
              disabled={alertsLoading}
              className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${alertsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {alertsLoading ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono text-xs">Loading threat alerts...</div>
            ) : securityAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 text-xs font-semibold">No active security alerts recorded. System status normal.</div>
            ) : (
              securityAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 dark:text-rose-300 light:text-rose-700 border border-rose-500/30'
                          : alert.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 dark:text-amber-300 light:text-amber-800 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 dark:text-blue-300 light:text-blue-700 border border-blue-500/30'
                      }`}>
                        {alert.riskLevel}
                      </span>
                      <span className="font-mono font-bold text-white dark:text-white light:text-slate-900 text-xs">{alert.alertType}</span>
                    </div>
                    <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">{alert.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono">Target: {alert.user?.email || 'SYSTEM'}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono shrink-0">{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Support Tickets Section */}
      {activeSection === 'support' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">User Support Tickets Management</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Review user support queries, account reset requests &amp; status updates</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={supportStatusFilter}
                onChange={(e) => {
                  setSupportStatusFilter(e.target.value);
                }}
                className="bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <button
                onClick={fetchAdminSupportTickets}
                disabled={supportLoading}
                className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${supportLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {supportLoading ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono text-xs">Loading support tickets...</div>
            ) : supportTickets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 text-xs font-semibold">No user support tickets match the selected filter.</div>
            ) : (
              supportTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-bold text-xs">#{ticket.id.substring(0, 8)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300">
                          {ticket.category?.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          ticket.status === 'OPEN'
                            ? 'bg-amber-500/20 text-amber-300 dark:text-amber-300 light:text-amber-800 border border-amber-500/30'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/20 text-blue-300 dark:text-blue-300 light:text-blue-700 border border-blue-500/30'
                            : ticket.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/30'
                            : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm">{ticket.subject}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">From: {ticket.user?.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold">Update Status:</span>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                        className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-indigo-500/30 dark:border-indigo-500/30 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono pt-1">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Adaptive Security Section */}
      {activeSection === 'adaptive' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">File-Aware Risk-Adaptive Zero-Trust Decisions</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Real-time risk scoring, DEK release gating &amp; adaptive decision audit telemetry</p>
              </div>
            </div>

            <button
              onClick={fetchAdminAdaptiveDecisions}
              disabled={adaptiveLoading}
              className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${adaptiveLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 dark:text-slate-300 light:text-slate-800">
              <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100 text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">File &amp; Sensitivity</th>
                  <th className="py-3 px-4">Requested Access</th>
                  <th className="py-3 px-4">Adaptive Decision</th>
                  <th className="py-3 px-4">Risk Score / Level</th>
                  <th className="py-3 px-4">Reasons</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 dark:divide-slate-800 light:divide-slate-200">
                {adaptiveDecisions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-medium">
                      No adaptive security decisions logged yet.
                    </td>
                  </tr>
                ) : (
                  adaptiveDecisions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-100">
                      <td className="py-3.5 px-4 font-bold text-white dark:text-white light:text-slate-900">{item.user?.email || item.userId}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-indigo-300 dark:text-indigo-300 light:text-indigo-700">{item.file?.originalFilename || 'Direct File Access'}</p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">{item.fileSensitivity || 'INTERNAL'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300 dark:text-slate-300 light:text-slate-800">{item.requestedAccess}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide border ${
                          item.decision === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border-emerald-500/20' :
                          item.decision === 'VIEW_ONLY' ? 'bg-amber-500/10 text-amber-300 dark:text-amber-300 light:text-amber-800 border-amber-500/20' :
                          item.decision === 'MFA_REQUIRED' ? 'bg-purple-500/10 text-purple-300 dark:text-purple-300 light:text-purple-700 border-purple-500/20' :
                          'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/20 animate-pulse'
                        }`}>
                          {item.decision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">{item.riskScore}/100</span>
                        <span className={`ml-2 text-[10px] font-bold ${
                          item.riskLevel === 'CRITICAL' ? 'text-rose-400 dark:text-rose-400 light:text-rose-700' :
                          item.riskLevel === 'HIGH' ? 'text-amber-400 dark:text-amber-400 light:text-amber-800' :
                          item.riskLevel === 'MEDIUM' ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-700' : 'text-emerald-400 dark:text-emerald-400 light:text-emerald-700'
                        }`}>
                          ({item.riskLevel})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-xs truncate font-mono">
                        {Array.isArray(item.reasons) ? item.reasons.join(', ') : 'Standard evaluation'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-500 light:text-slate-500 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Health Section */}
      {activeSection === 'system' && (
        <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl light:shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Infrastructure &amp; System Health</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Live operational status of PostgreSQL, Redis, MinIO &amp; Cryptographic Engine</p>
              </div>
            </div>

            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#121827] dark:bg-[#121827] light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase">PostgreSQL Database</span>
                <span className={`w-2.5 h-2.5 rounded-full ${systemHealth?.services?.database?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <p className="text-[11px] text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-extrabold uppercase">
                {systemHealth?.services?.database?.status === 'healthy' ? 'HEALTHY & CONNECTED' : 'SERVICE CONNECTED'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                Host: localhost:5432 {systemHealth?.services?.database?.latencyMs ? `(${systemHealth.services.database.latencyMs}ms)` : ''}
              </p>
            </div>

            <div className="bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase">Redis Cache &amp; Rate-Limit</span>
                <span className={`w-2.5 h-2.5 rounded-full ${systemHealth?.services?.redis?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <p className="text-[11px] text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-extrabold uppercase">
                {systemHealth?.services?.redis?.status === 'healthy' ? 'HEALTHY & ACTIVE' : 'SERVICE ACTIVE'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                Host: localhost:6379 {systemHealth?.services?.redis?.latencyMs ? `(${systemHealth.services.redis.latencyMs}ms)` : ''}
              </p>
            </div>

            <div className="bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase">MinIO Object Vault</span>
                <span className={`w-2.5 h-2.5 rounded-full ${systemHealth?.services?.minio?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <p className="text-[11px] text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-extrabold uppercase">
                {systemHealth?.services?.minio?.status === 'healthy' ? 'HEALTHY (filevault-vault)' : 'STORAGE ACTIVE'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                Host: localhost:9000 {systemHealth?.services?.minio?.latencyMs ? `(${systemHealth.services.minio.latencyMs}ms)` : ''}
              </p>
            </div>

            <div className="bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-300 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase">AES-256-GCM Engine</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-extrabold uppercase">ZERO-TRUST ACTIVE</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">Payload Auth Tag Enabled</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Detailed User Panel */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-indigo-500/30 dark:border-indigo-500/30 light:border-slate-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900">User Inspection Panel</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">{userDetail?.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedUserId(null); setUserDetail(null); }}
                className="text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 p-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !userDetail ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono text-xs">
                Retrieving non-sensitive account metadata...
              </div>
            ) : (
              <div className="space-y-6 text-xs text-slate-300 dark:text-slate-300 light:text-slate-800">
                {/* Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Account ID</span>
                    <p className="font-mono text-white dark:text-white light:text-slate-900 text-[11px] truncate">{userDetail.user.id}</p>
                  </div>
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Role</span>
                    <p className="font-bold text-indigo-400 dark:text-indigo-400 light:text-indigo-600">{userDetail.user.role}</p>
                  </div>
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Status</span>
                    <p className={`font-bold ${userDetail.user.status === 'ACTIVE' ? 'text-emerald-400 dark:text-emerald-400 light:text-emerald-700' : 'text-rose-400 dark:text-rose-400 light:text-rose-700'}`}>
                      {userDetail.user.status}
                    </p>
                  </div>
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Auth Provider</span>
                    <p className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">{userDetail.user.authProvider}</p>
                  </div>
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Files Uploaded</span>
                    <p className="font-bold text-purple-300 dark:text-purple-300 light:text-purple-700">{userDetail.user._count.ownedFiles}</p>
                  </div>
                  <div className="p-3 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold uppercase">Shares Active</span>
                    <p className="font-bold text-blue-300 dark:text-blue-300 light:text-blue-700">{userDetail.user._count.sharesGiven}</p>
                  </div>
                </div>

                {/* Audit & Session History */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white dark:text-white light:text-slate-900 uppercase text-[11px] tracking-wider">
                    Recent Activity Logs
                  </h4>
                  <div className="bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-800 dark:divide-slate-800 light:divide-slate-200">
                    {userDetail.recentLogs.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 dark:text-slate-500 light:text-slate-400">No activity recorded yet</div>
                    ) : (
                      userDetail.recentLogs.map((log) => (
                        <div key={log.id} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-indigo-300 dark:text-indigo-300 light:text-indigo-700">{log.actionType}</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono">{log.ipAddress} — {log.userAgent.slice(0, 40)}...</p>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <button
                    onClick={() => handleToggleSuspend(userDetail.user as any)}
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      userDetail.user.status === 'ACTIVE'
                        ? 'bg-amber-500/20 text-amber-300 dark:text-amber-300 light:text-amber-800 border border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {userDetail.user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                  </button>

                  <button
                    onClick={() => handleResetAccount(userDetail.user as any)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-500/20 text-purple-300 dark:text-purple-300 light:text-purple-800 border border-purple-500/30 hover:bg-purple-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Reset Account
                  </button>

                  <button
                    onClick={() => {
                      const target = userDetail.user as any;
                      setSelectedUserId(null);
                      setUserDetail(null);
                      setDeleteConfirmUser(target);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-500/20 text-rose-300 dark:text-rose-300 light:text-rose-800 border border-rose-500/30 hover:bg-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Destructive Account Deletion Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-rose-500/40 dark:border-rose-500/40 light:border-rose-300 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden text-white dark:text-white light:text-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 text-rose-400 dark:text-rose-400 light:text-rose-600 rounded-2xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
                This action will permanently delete user account <br />
                <strong className="text-rose-300 dark:text-rose-300 light:text-rose-700 font-mono font-bold">{deleteConfirmUser.email}</strong> <br />
                and associated access permissions.
              </p>
              <div className="p-3 bg-rose-950/40 dark:bg-rose-950/40 light:bg-rose-50 border border-rose-800/40 dark:border-rose-800/40 light:border-rose-200 rounded-xl text-[11px] text-rose-200/90 dark:text-rose-200/90 light:text-rose-900 text-left space-y-1">
                <p>• All active sessions and refresh tokens will be invalidated.</p>
                <p>• The email address will be completely freed for fresh registration.</p>
                <p>• Security audit logs will retain compliance history.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                disabled={actionLoading}
                className="w-1/2 py-2.5 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAccount(deleteConfirmUser)}
                disabled={actionLoading}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
