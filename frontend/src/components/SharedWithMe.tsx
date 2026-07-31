import { useState, useEffect } from 'react';
import { apiRequest, getAccessToken } from '../api/apiClient';
import {
  Download,
  Info,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface SharedFileItem {
  shareId: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt: string | null;
  sharedAt: string;
  sharedByEmail: string;
  file: {
    id: string;
    originalFilename: string;
    size: number;
    mimeType: string;
    sha256Hash: string;
    integrityStatus: 'OK' | 'TAMPERED';
    createdAt: string;
    owner: {
      id: string;
      email: string;
    };
  };
}

interface SharedWithMeProps {
  onSelectDetails: (fileId: string) => void;
}

export function SharedWithMe({ onSelectDetails }: SharedWithMeProps) {
  const [shares, setShares] = useState<SharedFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchSharedFiles = async () => {
    setLoading(true);
    setDownloadError(null);
    try {
      const data = await apiRequest<{ shares: SharedFileItem[] }>('/api/shares/shared-with-me');
      setShares(data.shares);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to fetch files shared with you');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const handleDownload = async (item: SharedFileItem) => {
    if (item.permission !== 'DOWNLOAD') {
      setDownloadError(`Download blocked: File '${item.file.originalFilename}' was shared with VIEW-only permission.`);
      return;
    }

    setDownloadingId(item.file.id);
    setDownloadError(null);

    try {
      const token = getAccessToken();
      const response = await fetch(`/api/files/${item.file.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Decryption download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.file.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(`Download failed for '${item.file.originalFilename}': ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-white text-lg flex items-center gap-2.5 tracking-tight">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          Files Shared With Me ({shares.length})
        </h3>

        <button
          onClick={fetchSharedFiles}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono font-medium text-slate-300 rounded-xl border border-white/10 transition-all hover:border-cyan-500/40 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {downloadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-cyan-400 text-xs tracking-wider flex items-center justify-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>POLLING SHARED CIPHERTEXT FILES...</span>
        </div>
      ) : shares.length === 0 ? (
        <div className="py-16 text-center border border-white/10 rounded-3xl bg-slate-900/30 backdrop-blur-xl text-slate-400 text-sm space-y-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <p className="font-extrabold text-white text-base">NO SHARED FILES FOUND</p>
          <p className="text-xs text-slate-400">Files shared with your account by other vault users will appear here.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-5">File Name &amp; Meta</th>
                  <th className="py-4 px-5">Shared By</th>
                  <th className="py-4 px-5">Permission Level</th>
                  <th className="py-4 px-5">Size</th>
                  <th className="py-4 px-5">Expiration</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shares.map((item) => (
                  <tr key={item.shareId} className="hover:bg-slate-800/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 shrink-0 shadow-inner">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm tracking-tight">{item.file.originalFilename}</p>
                          <span className="text-[11px] text-slate-400/80">
                            ID: {item.file.id.substring(0, 13)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-200">{item.sharedByEmail}</td>
                    <td className="py-4 px-5">
                      {item.permission === 'DOWNLOAD' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-extrabold text-[10px] tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> DOWNLOAD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-extrabold text-[10px] tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> VIEW ONLY
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 font-mono font-semibold text-slate-300">{formatFileSize(item.file.size)}</td>
                    <td className="py-4 px-5 text-slate-400">
                      {item.expiresAt ? (
                        <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400/80">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId === item.file.id || item.permission !== 'DOWNLOAD'}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(52,211,153,0.2)] disabled:opacity-30"
                          title={
                            item.permission === 'DOWNLOAD'
                              ? 'Decrypt & Download Stream'
                              : 'Download prohibited (VIEW-only permission)'
                          }
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectDetails(item.file.id)}
                          className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-110 active:scale-95"
                          title="Inspect Cryptographic Envelope Parameters"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
