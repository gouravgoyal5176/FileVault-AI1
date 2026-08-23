import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { OtpModal } from './OtpModal';
import { apiRequest } from '../api/apiClient';
import { AuthBackground } from './auth/AuthBackground';
import { SecurityVisual } from './auth/SecurityVisual';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Real-time password criteria verification
  const rules = [
    { label: 'At least 8 characters long', valid: password.length >= 8 },
    { label: 'Contains uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Contains number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Contains special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setDetails(null);

    if (!passwordsMatch) {
      setError('Master passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send registration email OTP via Nodemailer Gmail SMTP
      await apiRequest('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      // Step 2: Open verification modal for 6-digit OTP
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email verification code');
      if (err.details && Array.isArray(err.details)) {
        setDetails(err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (otpCode: string) => {
    setLoading(true);
    try {
      await register(email, password, otpCode);
      setIsOtpModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed after verification.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError(null);
    setDetails(null);
    setLoading(true);

    try {
      await loginWithGoogle(idToken);
    } catch (err: any) {
      setError(err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden select-none">
      {/* Cybersecurity Ambient Canvas Background */}
      <AuthBackground />

      <div className="w-full max-w-6xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* LEFT COLUMN: Security Showcase Visual (Desktop Showcase / Compact Mobile Header) */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <SecurityVisual mode="register" />
        </div>

        {/* RIGHT COLUMN: Premium Glass Registration Card */}
        <motion.div 
          className="lg:col-span-6 order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-[#0B0F1A]/85 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-indigo-950/80 space-y-6 relative overflow-hidden">
            {/* Subtle Top Card Gradient Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-80" />

            {/* Card Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase">
                  ZERO-TRUST VAULT
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Secure Vault</h2>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                Zero-Trust Client-Isolated User Registration &amp; Encryption Setup.
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
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Registration Failure</span>
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-[#070A12]/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block">Master Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 bg-[#070A12]/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Validator Indicator */}
              {password.length > 0 && (
                <motion.div 
                  className="p-3.5 rounded-2xl bg-[#070A12]/90 border border-slate-800 space-y-2 text-xs"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-mono font-bold text-slate-400 tracking-wider uppercase text-[10px] block">
                    Security Standards Check
                  </span>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {rule.valid ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span className={rule.valid ? 'text-emerald-300 font-semibold' : 'text-slate-500'}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block">Confirm Master Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 bg-[#070A12]/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-rose-400 font-semibold pt-0.5">Master passwords do not match</p>
                )}
              </div>

              {/* Submit CTA */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Dispatching Verification Code...</span>
                  </div>
                ) : (
                  <>
                    <span>Verify Email &amp; Create Vault</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Social Auth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <span className="bg-[#0B0F1A] px-3">Or register with</span>
              </div>
            </div>

            {/* Google Identity Services Button */}
            <GoogleAuthButton
              buttonText="signup_with"
              onSuccess={handleGoogleSuccess}
              onError={(errMsg) => setError(errMsg)}
            />

            {/* Card Footer */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Already have a secure vault account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold cursor-pointer transition ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Registration Email OTP Verification Modal */}
      <OtpModal
        isOpen={isOtpModalOpen}
        email={email}
        onVerified={handleOtpVerified}
        onClose={() => setIsOtpModalOpen(false)}
      />
    </div>
  );
}
