import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Sliders,
  LogOut,
  Mail,
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
          {/* Prepared Google OAuth Architecture Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Google OAuth Single Sign-On ("Continue with Google")
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-300 font-bold uppercase">
                      Phase 2 Architecture Prepared
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Third-party Google identity integration interface</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                The frontend UI architecture for Google OAuth authentication is prepared. Actual OAuth callback routes and client credentials will be integrated in Phase 2 once initial security baseline is stabilized.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  disabled
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-400 font-bold text-xs opacity-60 flex items-center gap-2 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Connect Google Account (Phase 2)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Prepared Gmail SMTP OTP Architecture Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    Gmail SMTP Multi-Factor OTP Verification
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-300 font-bold uppercase">
                      Phase 2 Architecture Prepared
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Time-based email OTP verification for login &amp; sensitive vault operations</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Email OTP verification architecture UI controls are prepared. Nodemailer SMTP transport and OTP token expiry models will be activated in Phase 2.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Email 2FA Ready</span>
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
