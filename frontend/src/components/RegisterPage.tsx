import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

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
      await register(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      if (err.details && Array.isArray(err.details)) {
        setDetails(err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 z-10">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.25)] mb-1">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-mono">Create Encrypted Vault</h2>
          <p className="text-xs text-slate-400 font-mono">Zero-Trust client-isolated user registration</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>Registration Failed</span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed font-mono">{error}</p>
            {details && details.length > 0 && (
              <ul className="text-xs space-y-1 list-disc list-inside opacity-80 pt-1 font-mono">
                {details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-400/70 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400/70 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-emerald-300 transition-colors focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator with Glowing Tech-Dots */}
          {password.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono backdrop-blur-md shadow-inner">
              <span className="font-bold text-slate-300 tracking-wider uppercase text-[10px] block mb-1 text-cyan-400">Security Standards Check</span>
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div
                    className={
                      rule.valid
                        ? 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse shrink-0'
                        : 'w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)] shrink-0'
                    }
                  />
                  <span className={rule.valid ? 'text-emerald-300 font-semibold tracking-wide' : 'text-slate-400 opacity-80'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">Confirm Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400/70 absolute left-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-emerald-300 transition-colors focus:outline-none"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-rose-400 font-mono font-semibold">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] hover:scale-[1.02] active:scale-95 uppercase tracking-wider font-mono disabled:opacity-50"
          >
            {loading ? 'CREATING VAULT...' : 'CREATE VAULT ACCOUNT'}
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center font-mono">
          <p className="text-xs text-slate-400">
            Already have a vault account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
