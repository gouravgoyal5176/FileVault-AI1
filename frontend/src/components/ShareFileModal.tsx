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
    setLoading(true);

    try {
      await apiRequest('/api/shares', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          recipientEmail: email,
          permission,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      setSuccessMsg(`File shared with ${email} (${permission} permission).`);
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-lg w-full p-7 shadow-[0_0_60px_rgba(0,0,0,0.8)] space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">SECURE FILE SHARING</h3>
              <p className="text-xs text-slate-400 font-bold truncate max-w-[280px]">{filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Recipient Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Permission Level</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  permission === 'VIEW'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:border-white/20'
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
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  permission === 'DOWNLOAD'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:border-white/20'
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
            <label className="font-bold text-slate-300">Expiration Date (Optional)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-3.5" />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-95 uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'GRANTING ACCESS...' : 'GRANT SHARE ACCESS'}
          </button>
        </form>

        {/* Existing Shares List */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <h4 className="font-bold text-slate-300 text-xs flex items-center gap-2 tracking-wide uppercase">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Active Shares ({shares.length})
          </h4>

          {sharesLoading ? (
            <p className="text-[11px] text-cyan-400/80 tracking-wider">LOADING ACTIVE SHARES...</p>
          ) : shares.length === 0 ? (
            <p className="text-[11px] text-slate-400">No active shares granted for this file yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
              {shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-slate-950/80 rounded-2xl border border-white/10 text-xs shadow-inner"
                >
                  <div>
                    <p className="font-bold text-white tracking-wide">{s.sharedWith.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                          s.permission === 'DOWNLOAD'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                        }`}
                      >
                        {s.permission}
                      </span>
                      {s.expiresAt && (
                        <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          Expires: {new Date(s.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(s.id, s.sharedWith.email)}
                    className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-500/30 hover:border-rose-500/60 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
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
