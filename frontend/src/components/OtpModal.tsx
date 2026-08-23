import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, X } from 'lucide-react';
import { apiRequest } from '../api/apiClient';

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  onVerified: (otpCode: string) => Promise<void>;
  onClose: () => void;
}

export function OtpModal({ isOpen, email, onVerified, onClose }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

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
      setSuccess('Email verified successfully! Initializing encrypted vault...');
      await onVerified(otp);
    } catch (err: any) {
      setSuccess(null);
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
      await apiRequest('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess('A new 6-digit verification code has been dispatched to your email.');
      setCooldownSeconds(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <motion.div 
        className="bg-[#0B0F1A]/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-emerald-950/80 space-y-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Top Accent Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-90" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition cursor-pointer"
          title="Cancel Verification"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-1 shadow-xs">
            <Mail className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Verify Your Email</h3>
          <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
            We dispatched a 6-digit registration code to <br />
            <strong className="text-emerald-300 font-bold font-mono">{email}</strong>
          </p>
        </div>

        {/* Banners */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1 text-xs"
            >
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Verification Failed</span>
              </div>
              <p className="opacity-90 leading-relaxed font-mono">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1 text-xs"
            >
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Successfully</span>
              </div>
              <p className="opacity-90 leading-relaxed font-mono">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block text-center">
              ENTER 6-DIGIT REGISTRATION CODE
            </label>
            <input
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
              className="w-full text-center text-2xl sm:text-3xl font-black tracking-[8px] sm:tracking-[10px] py-4 bg-[#05070E]/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-emerald-300 placeholder-slate-600 focus:outline-none transition-all duration-200 shadow-inner font-mono"
            />
            <p className="text-[10px] sm:text-xs text-slate-400 text-center font-medium">
              Check your Gmail inbox or spam folder. Code expires in 5 minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <motion.button
            type="submit"
            disabled={loading || otp.length !== 6}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Verifying Code...</span>
              </div>
            ) : (
              <>
                <span>Verify Email &amp; Create Vault</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </motion.button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || resending}
            className="text-emerald-400 font-bold hover:underline flex items-center gap-1.5 disabled:text-slate-500 disabled:no-underline cursor-pointer disabled:cursor-not-allowed py-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldownSeconds > 0 ? `Resend Code (${cooldownSeconds}s)` : resending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
