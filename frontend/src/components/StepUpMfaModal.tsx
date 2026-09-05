import { useState } from 'react';
import { apiRequest } from '../api/apiClient';
import { ShieldAlert, KeyRound, X, RefreshCw } from 'lucide-react';

interface StepUpMfaModalProps {
  isOpen: boolean;
  fileId?: string | null;
  filename?: string;
  riskLevel?: string;
  fileSensitivity?: string;
  onClose: () => void;
  onSuccess: (stepUpToken: string) => void;
}

export function StepUpMfaModal({
  isOpen,
  fileId,
  filename,
  riskLevel,
  fileSensitivity,
  onClose,
  onSuccess,
}: StepUpMfaModalProps) {
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await apiRequest('/api/auth/step-up-mfa/send', {
        method: 'POST',
        body: JSON.stringify({ fileId }),
      });
      setSentMessage(res.message || `Verification code sent to ${res.email || 'your registered email'}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setVerifying(true);
    setError(null);
    try {
      const res = await apiRequest('/api/auth/step-up-mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ otp: otp.trim(), fileId }),
      });

      if (res.stepUpToken) {
        onSuccess(res.stepUpToken);
        onClose();
      } else {
        throw new Error('Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0F1A] border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Security Verification Required 🔐</h3>
            <p className="text-xs text-slate-400 mt-0.5">Please verify your identity to continue.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
          Accessing <span className="font-bold text-white">{filename || 'this sensitive file'}</span> under current security conditions requires Step-Up MFA authorization.
        </p>

        {(riskLevel || fileSensitivity) && (
          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            {riskLevel && <span>Risk Level: <strong className="text-amber-400 font-extrabold">{riskLevel}</strong></span>}
            {fileSensitivity && <span>File Sensitivity: <strong className="text-indigo-400 font-extrabold">{fileSensitivity}</strong></span>}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {sentMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-medium">
            {sentMessage}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">Gmail Verification Code (6-Digit OTP)</label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sending}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
              >
                {sending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                {sending ? 'Sending...' : 'Send Code'}
              </button>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full bg-[#05070E] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-center font-mono text-lg tracking-widest outline-none transition"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || !otp.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
