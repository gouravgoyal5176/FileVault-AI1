import { useState, FormEvent } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { LoginOtpModal } from './LoginOtpModal';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, setSession, loginWithGoogle } = useAuth();
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
      setError(err.message || 'Login failed');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl mb-1 shadow-xs">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">FileVault AI</h2>
            <p className="text-xs text-slate-500 font-medium">Zero-Trust Encrypted File Vault Authentication</p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Authentication Error</span>
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
              <label className="text-xs font-semibold text-slate-700">Master Account Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Authenticating...' : 'Sign In to Vault'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Social / GIS Auth Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-3">Or continue with</span>
            </div>
          </div>

          {/* Google Identity Services Button */}
          <GoogleAuthButton
            buttonText="continue_with"
            onSuccess={handleGoogleSuccess}
            onError={(errMsg) => setError(errMsg)}
          />

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have a secure vault account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Register Account
              </button>
            </p>
          </div>
        </div>
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
