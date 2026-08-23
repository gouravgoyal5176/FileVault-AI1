import { useState } from 'react';
import { getAccessToken } from '../api/apiClient';
import {
  Download,
  Trash2,
  Info,
  ShieldCheck,
  ShieldAlert,
  Search,
  FileText,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertTriangle,
  Share2,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FileItem {
  id: string;
  originalFilename: string;
  storageKey: string;
  size: number;
  mimeType: string;
  sha256Hash: string;
  integrityStatus: 'OK' | 'TAMPERED';
  isHoneyfile: boolean;
  createdAt: string;
}

interface FileListProps {
  files: FileItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectDetails: (fileId: string) => void;
  onSelectShare: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  externalSearch?: string;
}

export function FileList({
  files,
  loading,
  onRefresh,
  onSelectDetails,
  onSelectShare,
  onDelete,
  externalSearch = '',
}: FileListProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const query = externalSearch || internalSearch;

  const filteredFiles = files.filter((f) =>
    f.originalFilename.toLowerCase().includes(query.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html'))
      return <FileCode className="w-5 h-5 text-amber-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    setDownloadError(null);

    try {
      const token = getAccessToken();
      const response = await fetch(`/api/files/${file.id}/download`, {
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
      a.download = file.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(`Download blocked for '${file.originalFilename}': ${err.message}`);
      onRefresh();
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Search Bar */}
      {!externalSearch && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder="Search encrypted vault files by name..."
              className="w-full pl-10 pr-4 py-2 bg-[#121829] dark:bg-[#121829] light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
            />
          </div>
        </div>
      )}

      {downloadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs rounded-2xl flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* File List Table */}
      {loading ? (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm space-y-3 shadow-xl light:shadow-md light:shadow-slate-200/50">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <p className="font-extrabold text-white dark:text-white light:text-slate-900 text-base">Your vault is empty</p>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-sm mx-auto">
            Upload your first file to encrypt it automatically with AES-256-GCM envelope encryption.
          </p>
        </div>
      ) : (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl overflow-hidden shadow-xl light:shadow-md light:shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
              <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">File &amp; Encryption Badges</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Integrity Status</th>
                  <th className="py-3.5 px-5">Uploaded</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                <AnimatePresence>
                  {filteredFiles.map((file) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors duration-150 hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100/80"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0 shadow-sm">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div>
                            <p className="font-bold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2">
                              {file.originalFilename}
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> AES-256
                              </span>
                              {file.isHoneyfile && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 dark:text-amber-300 light:text-amber-800 border border-amber-500/20 text-[10px] font-extrabold tracking-wider">
                                  HONEYFILE
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-400 font-mono">ID: {file.id.substring(0, 13)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold">{formatFileSize(file.size)}</td>
                      <td className="py-4 px-5">
                        {file.integrityStatus === 'OK' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 border border-emerald-500/20 font-bold text-[10px] tracking-wide">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/20 font-bold text-[10px] tracking-wide animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> TAMPERED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(file)}
                            disabled={downloadingId === file.id || file.integrityStatus === 'TAMPERED'}
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 rounded-xl border border-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
                            title="Decrypt and Stream Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/files/${file.id}/verify`, {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${getAccessToken()}`,
                                  },
                                });
                                const data = await res.json();
                                if (data.verified) {
                                  alert(`[VERIFIED OK] ${file.originalFilename}\nGCM Auth Tag & SHA-256 Checksum Valid.`);
                                } else {
                                  alert(`[TAMPERED DETECTED] ${file.originalFilename}\n${data.error}`);
                                }
                                onRefresh();
                              } catch (err: any) {
                                alert(`Verification error: ${err.message}`);
                              }
                            }}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 rounded-xl border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Verify File Integrity (GCM Tag & SHA-256 Checksum)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectShare(file)}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 dark:text-blue-300 light:text-blue-700 rounded-xl border border-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Grant or Manage Secure File Shares"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectDetails(file.id)}
                            className="p-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Inspect Cryptographic Envelope Parameters"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(file.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
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
