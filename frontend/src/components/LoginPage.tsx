import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, User } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { LoginOtpModal } from './LoginOtpModal';
import { AuthBackground } from './auth/AuthBackground';
import { SecurityVisual } from './auth/SecurityVisual';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSwitchToAdminLogin?: () => void;
  onBackToHome?: () => void;
}

export function LoginPage({ onSwitchToRegister, onSwitchToAdminLogin, onBackToHome }: LoginPageProps) {
  const { login, setSession, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setDetails(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.requiresOtp) {
        setIsOtpModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || 'Login authentication failed');
      if (err.details && Array.isArray(err.details)) {
        setDetails(err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (accessToken: string, user: User) => {
    setIsOtpModalOpen(false);
    setSession(accessToken, user);
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError(null);
    setDetails(null);
    setLoading(true);

    try {
      await loginWithGoogle(idToken);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] dark:bg-[#05070E] light:bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden select-none">
      {/* Cybersecurity Ambient Canvas Background */}
      <AuthBackground />

      <div className="w-full max-w-6xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* LEFT COLUMN: Security Showcase Visual (Desktop Showcase / Compact Mobile Header) */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <SecurityVisual mode="login" />
        </div>

        {/* RIGHT COLUMN: Premium Glass Authentication Card */}
        <motion.div 
          className="lg:col-span-6 order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-[#0B0F1A]/85 dark:bg-[#0B0F1A]/85 light:bg-white border border-indigo-500/20 dark:border-indigo-500/20 light:border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl dark:shadow-indigo-950/80 light:shadow-md space-y-6 relative overflow-hidden">
            {/* Subtle Top Card Gradient Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 opacity-80" />

            {/* Card Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-3 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl shadow-xs">
                    <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-100 dark:hover:text-slate-100 light:hover:text-slate-900 rounded-xl hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 transition cursor-pointer"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  </button>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 dark:text-emerald-400 light:text-emerald-700 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                    MFA PROTECTED
                  </span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 font-normal">
                Enter your master credentials to decrypt your secure vault.
              </p>
            </div>

            {/* Error Banner with Shake Variant */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 text-rose-300 dark:text-rose-300 light:text-rose-800 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-rose-400 dark:text-rose-400 light:text-rose-600">
                    <ShieldAlert className="w-4 h-4 text-rose-400 dark:text-rose-400 light:text-rose-600 shrink-0" />
                    <span>Authentication Failure</span>
                  </div>
                  <p className="opacity-90 leading-relaxed">{error}</p>
                  {details && details.length > 0 && (
                    <ul className="space-y-1 list-disc list-inside opacity-80 pt-1 font-mono text-[11px]">
                      {details.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 tracking-wide block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 dark:text-slate-500 light:text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-[#070A12]/90 dark:bg-[#070A12]/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 tracking-wide block">Master Password</label>
                  <button
                    type="button"
                    onClick={() => setError('Password reset links are disabled in zero-trust mode for maximum security.')}
                    className="text-[11px] text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 dark:text-slate-500 light:text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 bg-[#070A12]/90 dark:bg-[#070A12]/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Authenticating Vault...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Vault</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Social Auth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800 dark:border-slate-800 light:border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-400">
                <span className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white px-3">Or continue with</span>
              </div>
            </div>

            {/* Google Identity Services Button */}
            <GoogleAuthButton
              buttonText="continue_with"
              onSuccess={handleGoogleSuccess}
              onError={(errMsg) => setError(errMsg)}
            />

            {/* Card Footer */}
            <div className="pt-4 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
              <p>
                Don't have a secure vault account?{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 font-bold cursor-pointer transition ml-1"
                >
                  Create Vault
                </button>
              </p>
              {onSwitchToAdminLogin && (
                <button
                  onClick={onSwitchToAdminLogin}
                  className="text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 font-semibold cursor-pointer transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Login MFA Verification OTP Modal */}
      <LoginOtpModal
        isOpen={isOtpModalOpen}
        email={email}
        onSuccess={handleLoginSuccess}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
}
