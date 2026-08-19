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
  Lock
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
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2.5 tracking-tight">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          Files Shared With Me ({shares.length})
        </h3>

        <button
          onClick={fetchSharedFiles}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200/80 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {downloadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Polling shared files...</span>
        </div>
      ) : shares.length === 0 ? (
        <div className="py-16 text-center border border-slate-200/80 rounded-3xl bg-white text-slate-500 text-sm space-y-2 shadow-xs">
          <p className="font-bold text-slate-800 text-base">No shared files found</p>
          <p className="text-xs text-slate-400">Files shared with your account by other vault users will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">File &amp; Meta</th>
                  <th className="py-3.5 px-5">Shared By</th>
                  <th className="py-3.5 px-5">Permission Level</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Expiration</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shares.map((item) => (
                  <tr key={item.shareId} className="hover:bg-slate-50/60 transition-all duration-150">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {item.file.originalFilename}
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> AES-256
                            </span>
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {item.file.id.substring(0, 13)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">{item.sharedByEmail}</td>
                    <td className="py-4 px-5">
                      {item.permission === 'DOWNLOAD' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DOWNLOAD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[10px] tracking-wider">
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> VIEW ONLY
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 font-mono font-semibold text-slate-600">{formatFileSize(item.file.size)}</td>
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {item.expiresAt ? (
                        <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId === item.file.id || item.permission !== 'DOWNLOAD'}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
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
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
