import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, ShieldAlert, Sun, Moon } from 'lucide-react';
import { AuthBackground } from './auth/AuthBackground';
import { SecurityVisual } from './auth/SecurityVisual';

interface AdminLoginPageProps {
  onSwitchToUserLogin: () => void;
  onBackToHome?: () => void;
}

export function AdminLoginPage({ onSwitchToUserLogin, onBackToHome }: AdminLoginPageProps) {
  const { adminLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070E] dark:bg-[#05070E] light:bg-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden font-sans text-slate-100 dark:text-slate-100 light:text-slate-900 select-none">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side Visual */}
        <div className="hidden lg:block lg:col-span-6 space-y-6">
          <SecurityVisual mode="login" />
        </div>

        {/* Right Side Admin Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 bg-[#0B0F1A]/90 dark:bg-[#0B0F1A]/90 light:bg-white border border-indigo-500/30 dark:border-indigo-500/30 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl dark:shadow-indigo-950/50 light:shadow-md space-y-6 relative overflow-hidden"
        >
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          {/* Header */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>FileVault AI</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-100 dark:hover:text-slate-100 light:hover:text-slate-900 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition cursor-pointer"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
                {onBackToHome && (
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              Admin Access
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
              Enter authorized administrator credentials to access the security administration portal.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-rose-950/80 dark:bg-rose-950/80 light:bg-rose-50 border border-rose-500/40 dark:border-rose-500/40 light:border-rose-200 rounded-2xl text-xs text-rose-300 dark:text-rose-300 light:text-rose-800 flex items-start gap-3 shadow-lg"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 light:text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-200 dark:text-rose-200 light:text-rose-900">Authentication Rejected</p>
                <p className="text-rose-300/90 dark:text-rose-300/90 light:text-rose-800">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider block">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@filevault.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121827] dark:bg-[#121827] light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider block">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 light:text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121827] dark:bg-[#121827] light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-2xl pl-10 pr-10 py-3 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[11px] font-semibold cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-indigo-950/50 transition cursor-pointer flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span>Authenticating Administrator...</span>
              ) : (
                <>
                  <span>Access Admin Panel</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle Link */}
          <div className="pt-4 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 text-center">
            <button
              type="button"
              onClick={onSwitchToUserLogin}
              className="text-xs font-bold text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              ← Back to User Login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
