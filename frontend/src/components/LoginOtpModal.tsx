import { useState, useEffect, useRef, FormEvent } from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, X, Lock } from 'lucide-react';
import { apiRequest } from '../api/apiClient';
import { User } from '../context/AuthContext';

interface LoginOtpModalProps {
  isOpen: boolean;
  email: string;
  onSuccess: (accessToken: string, user: User) => void;
  onClose: () => void;
}

export function LoginOtpModal({ isOpen, email, onSuccess, onClose }: LoginOtpModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP input when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError(null);
      setSuccess(null);
      setCooldownSeconds(60);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer effect for 60-second resend cooldown
  useEffect(() => {
    if (!isOpen) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, cooldownSeconds]);

  if (!isOpen) return null;

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6 || !/^[0-9]+$/.test(otp)) {
      setError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<{ verified: boolean; accessToken: string; user: User }>('/api/auth/login/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      setSuccess('Login verified successfully! Redirecting to Dashboard...');
      setTimeout(() => {
        onSuccess(response.accessToken, response.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;

    setError(null);
    setSuccess(null);
    setResending(true);

    try {
      await apiRequest('/api/auth/login/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess('A new 6-digit login verification code has been sent to your email.');
      setCooldownSeconds(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          title="Cancel Verification"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl mb-1 shadow-xs">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Verify Your Login</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            We sent a 6-digit verification code to <br />
            <strong className="text-slate-900 font-bold">{email}</strong>
          </p>
        </div>

        {/* Banners */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Verification Failed</span>
            </div>
            <p className="opacity-90 leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Successfully</span>
            </div>
            <p className="opacity-90 leading-relaxed">{success}</p>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-center">
              Enter 6-Digit Verification Code
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setError(null);
                setOtp(e.target.value.replace(/[^0-9]/g, ''));
              }}
              placeholder="123456"
              required
              className="w-full text-center text-2xl sm:text-3xl font-black tracking-[6px] sm:tracking-[8px] py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-indigo-950 placeholder-slate-300 focus:outline-none transition shadow-inner font-mono"
            />
            <p className="text-[10px] sm:text-xs text-slate-400 text-center font-medium">
              Check your Gmail inbox or spam folder for code. Code expires in 5 minutes.
            </p>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Verifying Login...' : 'Verify & Enter Vault'}
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || resending}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1.5 disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed py-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldownSeconds > 0 ? `Resend Code (${cooldownSeconds}s)` : resending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
