import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { OtpModal } from './OtpModal';
import { apiRequest } from '../api/apiClient';

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
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send registration email OTP via Nodemailer SMTP
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

  const handleOtpVerified = async () => {
    setLoading(true);
    try {
      await register(email, password);
      setIsOtpModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed after verification.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl mb-1 shadow-xs">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Encrypted Vault</h2>
            <p className="text-xs text-slate-500 font-medium">Zero-Trust Client-Isolated User Registration</p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Registration Failed</span>
              </div>
              <p className="opacity-90 leading-relaxed">{error}</p>
              {details && details.length > 0 && (
                <ul className="space-y-1 list-disc list-inside opacity-80 pt-1">
                  {details.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Validator Indicator */}
            {password.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-700 tracking-wider uppercase text-[10px] block">Security Standards Check</span>
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {rule.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={rule.valid ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Confirm Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-rose-600 font-semibold">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending Verification Code...' : 'Verify Email & Create Vault'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Social / GIS Registration Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-3">Or register with</span>
            </div>
          </div>

          {/* Google Identity Services Button */}
          <GoogleAuthButton
            buttonText="signup_with"
            onSuccess={handleGoogleSuccess}
            onError={(errMsg) => setError(errMsg)}
          />

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-emerald-600 hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
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
