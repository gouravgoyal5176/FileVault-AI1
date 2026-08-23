import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/apiClient';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  LogOut,
  Smartphone,
  Sparkles,
  Lock,
  Trash2,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export function SettingsPage() {
  const { user, logout, logoutAll } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'sessions' | 'notifications' | 'danger'>('account');

  // Account Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const handleDeleteAccountSelf = async () => {
    if (confirmInput.trim() !== 'DELETE') {
      setDeleteError('You must type DELETE in exact capital letters to confirm account deletion.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await apiRequest('/api/users/me', { method: 'DELETE' });
      alert('Your FileVault AI account has been deleted successfully.');
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-white dark:text-white light:text-slate-900">
      {/* Header Banner */}
      <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Account &amp; Security Settings
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
            Manage your Zero-Trust account parameters, session security, and communication preferences.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs font-bold flex items-center gap-2 self-start md:self-auto">
          <Lock className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
          <span>AES-256 Vault Account</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'account'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security &amp; OAuth/OTP</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Active Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-rose-400 dark:text-rose-400 light:text-rose-600 hover:text-rose-300 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-600">User Identity Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold text-[10px]">Email Identity</span>
                <span className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm">{user.email}</span>
              </div>

              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold text-[10px]">Access Role</span>
                <span className="font-extrabold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 text-sm uppercase">{user.role}</span>
              </div>

              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold text-[10px]">User Account ID</span>
                <span className="font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs font-semibold">{user.id}</span>
              </div>

              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 block font-bold text-[10px]">Vault Allocation Quota</span>
                <span className="font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600 text-sm">2.00 GB (Enforced)</span>
              </div>
            </div>
          </div>

          {/* Account Danger Zone Card */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-rose-300 dark:text-rose-300 light:text-rose-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Account Deletion Zone
                </h4>
                <p className="text-xs text-rose-200/80 dark:text-rose-200/80 light:text-rose-700 font-medium">
                  Permanently delete your account and associated vault access permissions.
                </p>
              </div>

              <button
                onClick={() => {
                  setConfirmInput('');
                  setDeleteError(null);
                  setDeleteModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-xl border border-indigo-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Authentication Provider &amp; Identity Verification
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Real-time status of your vault authentication method and email verification</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold text-[10px] uppercase block">Auth Provider</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-extrabold text-xs rounded-lg uppercase">
                    {user.authProvider || 'LOCAL'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 pt-1">
                  {user.authProvider === 'GOOGLE'
                    ? 'Authenticated via Google Identity Services.'
                    : user.authProvider === 'HYBRID'
                    ? 'Linked account (Password + Google GIS).'
                    : 'Standard Master Password authentication.'}
                </p>
              </div>

              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold text-[10px] uppercase block">Registration OTP Status</span>
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 font-extrabold text-xs rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Email Verified ✓
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 dark:text-amber-300 light:text-amber-800 font-extrabold text-xs rounded-lg">
                      Email Pending OTP Verification
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 pt-1">
                  Verified via Nodemailer Gmail SMTP 6-digit OTP code.
                </p>
              </div>

              <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2">
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-bold text-[10px] uppercase block">Google Account ID (sub)</span>
                <div className="font-mono text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 truncate">
                  {user.googleId ? user.googleId : 'Not Linked'}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 pt-1">
                  {user.googleId ? 'Google sub ID linked securely.' : 'Google Sign-In ready for linking.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Google Identity Services (GIS) Single Sign-On
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase">
                      Active &amp; Functional
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">GIS ID-Token client-side browser authentication</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2 text-xs">
              <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-medium">
                Google Identity Services browser ID-token verification is fully integrated. Google Sign-In automatically links with matching verified local email accounts or creates new encrypted user vaults.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-blue-500/10 text-blue-300 dark:text-blue-300 light:text-blue-700 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Google GIS Enabled</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-600">Active Device Sessions</h3>
            <button
              onClick={logoutAll}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 dark:text-rose-300 light:text-rose-700 font-bold text-xs rounded-xl border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke All Device Sessions</span>
            </button>
          </div>

          <div className="p-4 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2 text-xs">
            <p className="text-white dark:text-white light:text-slate-900 font-bold">Current Browser Session</p>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-[11px] font-mono">httpOnly Refresh Cookie Active • Redis Token Tracking Enforced</p>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 light:text-slate-600">Security Communication Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 cursor-pointer">
              <span className="font-bold text-white dark:text-white light:text-slate-900">Email alerts for CRITICAL threat detections</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700" />
            </label>
            <label className="flex items-center justify-between p-3.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 cursor-pointer">
              <span className="font-bold text-white dark:text-white light:text-slate-900">Alerts for Honeyfile deception traps</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700" />
            </label>
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-rose-300 dark:text-rose-300 light:text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-400" /> Account Danger Zone
            </h3>
            <p className="text-xs text-rose-200/80 dark:text-rose-200/80 light:text-rose-700 leading-relaxed max-w-2xl font-medium">
              Permanently delete your FileVault AI user account. This action cannot be undone. All active sessions will be invalidated and your registered email address will be completely freed.
            </p>
          </div>

          <div className="p-4 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white border border-rose-500/30 rounded-2xl space-y-2 text-xs text-rose-200 dark:text-rose-200 light:text-rose-800">
            <p className="font-bold uppercase tracking-wider text-[11px] text-rose-400">Security Policy Warnings:</p>
            <p>• Your authenticated identity token will be revoked immediately.</p>
            <p>• Owned vault files will be cleaned up and deleted from MinIO storage.</p>
            <p>• Historical compliance audit logs will retain anonymized system activity logs.</p>
          </div>

          <button
            onClick={() => {
              setConfirmInput('');
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Delete My Account</span>
          </button>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden text-white dark:text-white light:text-slate-900">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

            <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white dark:text-white light:text-slate-900">Confirm Account Deletion</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p className="leading-relaxed">
                This process is permanent and irreversible. To confirm deletion, type <strong className="text-rose-400 font-mono font-bold">DELETE</strong> into the field below:
              </p>

              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Type DELETE to confirm..."
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/30 text-rose-300 text-[11px] rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="w-1/2 py-2.5 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700 dark:border-slate-700 light:border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountSelf}
                disabled={deleting || confirmInput.trim() !== 'DELETE'}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
