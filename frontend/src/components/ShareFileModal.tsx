import { useState, useEffect, FormEvent } from 'react';
import { apiRequest } from '../api/apiClient';
import { Share2, X, Trash2, Mail, Calendar, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

interface ShareFileModalProps {
  fileId: string | null;
  filename: string;
  onClose: () => void;
}

interface ShareItem {
  id: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt: string | null;
  createdAt: string;
  sharedWith: {
    id: string;
    email: string;
  };
}

export function ShareFileModal({ fileId, filename, onClose }: ShareFileModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [expiresAt, setExpiresAt] = useState('');
  const [shares, setShares] = useState<ShareItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const fetchShares = async () => {
    if (!fileId) return;
    setSharesLoading(true);
    try {
      const data = await apiRequest<{ shares: ShareItem[] }>(`/api/shares/file/${fileId}`);
      setShares(data.shares);
    } catch (err) {
      // Ignore
    } finally {
      setSharesLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchShares();
    }
  }, [fileId]);

  if (!fileId) return null;

  const handleShare = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setWarningMsg(null);
    setLoading(true);

    try {
      const response = await apiRequest<{ message: string; emailSent?: boolean; emailError?: string }>('/api/shares', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          recipientEmail: email,
          permission,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      if (response.emailSent) {
        setSuccessMsg(`File shared successfully. Notification email submitted to ${email}.`);
      } else {
        setWarningMsg(`File shared successfully, but notification email could not be submitted to ${email}.`);
      }

      setEmail('');
      setExpiresAt('');
      fetchShares();
    } catch (err: any) {
      setError(err.message || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId: string, recipientEmail: string) => {
    if (!confirm(`Are you sure you want to revoke share access for ${recipientEmail}?`)) return;

    try {
      await apiRequest(`/api/shares/${shareId}`, { method: 'DELETE' });
      fetchShares();
    } catch (err: any) {
      alert(`Failed to revoke share: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Secure File Sharing</h3>
              <p className="text-xs text-slate-500 font-bold truncate max-w-[280px]">{filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {warningMsg && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Recipient Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Permission Level</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  permission === 'VIEW'
                    ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  value="VIEW"
                  checked={permission === 'VIEW'}
                  onChange={() => setPermission('VIEW')}
                  className="hidden"
                />
                <div>
                  <p className="text-xs tracking-wider">VIEW ONLY</p>
                  <p className="text-[10px] opacity-80 font-normal mt-0.5">Details preview, no download stream</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  permission === 'DOWNLOAD'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="permission"
                  value="DOWNLOAD"
                  checked={permission === 'DOWNLOAD'}
                  onChange={() => setPermission('DOWNLOAD')}
                  className="hidden"
                />
                <div>
                  <p className="text-xs tracking-wider">DOWNLOAD</p>
                  <p className="text-[10px] opacity-80 font-normal mt-0.5">Allows decrypted download stream</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Expiration Date (Optional)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Granting Access...' : 'Grant Share Access'}
          </button>
        </form>

        {/* Existing Shares List */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2 tracking-wide uppercase">
            <UserCheck className="w-4 h-4 text-indigo-600" /> Active Shares ({shares.length})
          </h4>

          {sharesLoading ? (
            <p className="text-[11px] text-slate-400 font-medium">Loading active shares...</p>
          ) : shares.length === 0 ? (
            <p className="text-[11px] text-slate-400">No active shares granted for this file yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 tracking-wide">{s.sharedWith.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                          s.permission === 'DOWNLOAD'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {s.permission}
                      </span>
                      {s.expiresAt && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          Expires: {new Date(s.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(s.id, s.sharedWith.email)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Revoke Share Access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
