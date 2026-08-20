import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  LogOut,
  Smartphone,
  Sparkles,
  Lock
} from 'lucide-react';

export function SettingsPage() {
  const { user, logoutAll } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'sessions' | 'notifications' | 'preferences'>('account');

  if (!user) return null;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-indigo-600" /> Account &amp; Security Settings
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage your Zero-Trust account parameters, session security, and communication preferences.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-2 self-start md:self-auto">
          <Lock className="w-3.5 h-3.5 text-indigo-600" />
          <span>AES-256 Vault Account</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'account'
              ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <User className="w-4 h-4 text-indigo-600" />
          <span>Account Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Security &amp; OAuth/OTP</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <KeyRound className="w-4 h-4 text-purple-600" />
          <span>Active Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-600" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">User Identity Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block font-bold text-[10px]">Email Identity</span>
              <span className="font-extrabold text-slate-900 text-sm">{user.email}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block font-bold text-[10px]">Access Role</span>
              <span className="font-extrabold text-indigo-700 text-sm uppercase">{user.role}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block font-bold text-[10px]">User Account ID</span>
              <span className="font-mono text-slate-700 text-xs font-semibold">{user.id}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block font-bold text-[10px]">Vault Allocation Quota</span>
              <span className="font-extrabold text-emerald-700 text-sm">2.00 GB (Enforced)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Active Authentication Provider & Identity Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Authentication Provider &amp; Identity Verification
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Real-time status of your vault authentication method and email verification</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* AuthProvider Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Auth Provider</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-lg uppercase">
                    {user.authProvider || 'LOCAL'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  {user.authProvider === 'GOOGLE'
                    ? 'Authenticated via Google Identity Services.'
                    : user.authProvider === 'HYBRID'
                    ? 'Linked account (Password + Google GIS).'
                    : 'Standard Master Password authentication.'}
                </p>
              </div>

              {/* Email Verification Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Registration OTP Status</span>
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Email Verified ✓
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs rounded-lg">
                      Email Pending OTP Verification
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Verified via Nodemailer Gmail SMTP 6-digit OTP code.
                </p>
              </div>

              {/* Google Identity Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Google Account ID (sub)</span>
                <div className="font-mono text-xs font-bold text-slate-800 truncate">
                  {user.googleId ? user.googleId : 'Not Linked'}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  {user.googleId ? 'Google sub ID linked securely.' : 'Google Sign-In ready for linking.'}
                </p>
              </div>
            </div>
          </div>

          {/* Google Identity Services Integration Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Google Identity Services (GIS) Single Sign-On
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold uppercase">
                      Active &amp; Functional
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">GIS ID-Token client-side browser authentication</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Google Identity Services browser ID-token verification is fully integrated. Google Sign-In automatically links with matching verified local email accounts or creates new encrypted user vaults.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Google GIS Enabled</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Device Sessions</h3>
            <button
              onClick={logoutAll}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke All Device Sessions</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <p className="text-slate-700 font-bold">Current Browser Session</p>
            <p className="text-slate-500 text-[11px] font-mono">httpOnly Refresh Cookie Active • Redis Token Tracking Enforced</p>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Communication Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
              <span className="font-bold text-slate-800">Email alerts for CRITICAL threat detections</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
            </label>
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
              <span className="font-bold text-slate-800">Alerts for Honeyfile deception traps</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
            </label>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vault Display Preferences</h3>
          <p className="text-slate-600 font-medium">
            Default Theme: <strong className="text-slate-900 font-bold">Light Enterprise SaaS Aesthetic</strong>
          </p>
        </div>
      )}
    </div>
  );
}
