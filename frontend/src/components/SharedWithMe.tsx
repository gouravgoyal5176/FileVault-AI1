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
import { motion, AnimatePresence } from 'framer-motion';

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
  searchQuery?: string;
}

export function SharedWithMe({ onSelectDetails, searchQuery = '' }: SharedWithMeProps) {
  const [shares, setShares] = useState<SharedFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const filteredShares = shares.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.file.originalFilename.toLowerCase().includes(q) ||
      item.sharedByEmail.toLowerCase().includes(q) ||
      (item.file.mimeType && item.file.mimeType.toLowerCase().includes(q)) ||
      (item.file.sha256Hash && item.file.sha256Hash.toLowerCase().includes(q))
    );
  });

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
    <div className="space-y-4 font-sans text-white dark:text-white light:text-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-lg flex items-center gap-2.5 tracking-tight">
          <UserCheck className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
          Files Shared With Me ({filteredShares.length})
        </h3>

        <button
          onClick={fetchSharedFiles}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#121829] dark:bg-[#121829] light:bg-white text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {downloadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs rounded-2xl flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredShares.length === 0 ? (
        <div className="py-16 text-center border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <p className="font-extrabold text-white dark:text-white light:text-slate-900 text-base">No shared files found</p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-sm mx-auto">
            {searchQuery ? `No shared files match "${searchQuery}"` : 'Encrypted files shared with your account by other vault users will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl overflow-hidden shadow-xl light:shadow-md light:shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
              <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">File &amp; Meta</th>
                  <th className="py-3.5 px-5">Shared By</th>
                  <th className="py-3.5 px-5">Permission Level</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Expiration</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                <AnimatePresence>
                  {filteredShares.map((item) => (
                    <motion.tr
                      key={item.shareId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      whileHover={{ backgroundColor: 'rgba(18, 24, 41, 0.7)' }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors duration-150"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0">
                            <FileText className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-bold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2">
                              {item.file.originalFilename}
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> AES-256
                              </span>
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono">
                              ID: {item.file.id.substring(0, 13)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">{item.sharedByEmail}</td>
                      <td className="py-4 px-5">
                        {item.permission === 'DOWNLOAD' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/20 font-extrabold text-[10px] tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DOWNLOAD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 dark:text-purple-300 light:text-purple-700 border border-purple-500/20 font-extrabold text-[10px] tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> VIEW ONLY
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">{formatFileSize(item.file.size)}</td>
                      <td className="py-4 px-5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                        {item.expiresAt ? (
                          <span className="flex items-center gap-1.5 text-amber-300 dark:text-amber-300 light:text-amber-800 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">Never</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(item)}
                            disabled={downloadingId === item.file.id || item.permission !== 'DOWNLOAD'}
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 rounded-xl border border-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
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
                            className="p-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Inspect Cryptographic Envelope Parameters"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
