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
  Share2,
  Lock,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { FileViewerModal } from './FileViewerModal';
import { StepUpMfaModal } from './StepUpMfaModal';

export interface FileItem {
  id: string;
  originalFilename: string;
  storageKey: string;
  size: number;
  mimeType: string;
  sha256Hash: string;
  integrityStatus: 'OK' | 'TAMPERED';
  isHoneyfile: boolean;
  sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'CRITICAL';
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
  const [viewModalFile, setViewModalFile] = useState<FileItem | null>(null);
  const [mfaModalFile, setMfaModalFile] = useState<FileItem | null>(null);

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

  const renderSensitivityBadge = (sensitivity?: string) => {
    const level = sensitivity || 'INTERNAL';
    switch (level) {
      case 'PUBLIC':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-50 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/20 dark:border-cyan-500/20 light:border-cyan-200 text-[10px] font-extrabold tracking-wider">
            PUBLIC
          </span>
        );
      case 'CONFIDENTIAL':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 text-amber-300 dark:text-amber-300 light:text-amber-700 border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-[10px] font-extrabold tracking-wider">
            CONFIDENTIAL
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/10 light:bg-orange-50 text-orange-400 dark:text-orange-400 light:text-orange-700 border border-orange-500/20 dark:border-orange-500/20 light:border-orange-200 text-[10px] font-extrabold tracking-wider">
            RESTRICTED
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 text-[10px] font-extrabold tracking-wider">
            CRITICAL
          </span>
        );
      case 'INTERNAL':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/10 dark:bg-slate-500/10 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-500/20 dark:border-slate-500/20 light:border-slate-300 text-[10px] font-extrabold tracking-wider">
            INTERNAL
          </span>
        );
    }
  };

  const handleDownload = async (file: FileItem, stepUpToken?: string) => {
    setDownloadingId(file.id);
    setDownloadError(null);

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (stepUpToken) {
        headers['x-step-up-token'] = stepUpToken;
      }

      const response = await fetch(`/api/files/${file.id}/download`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.mfaRequired) {
          setMfaModalFile(file);
          setDownloadingId(null);
          return;
        }
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
      setDownloadError(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input if no external search provided */}
      {!externalSearch && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 light:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Search files by name..."
            className="w-full bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white dark:text-white light:text-slate-900 focus:border-indigo-500 outline-none transition shadow-xs"
          />
        </div>
      )}

      {downloadError && (
        <div className="p-3 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError(null)} className="text-rose-400 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-500 light:text-slate-600 text-sm">Loading encrypted vault items...</div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-500 light:text-slate-600 text-sm bg-[#0B0F1A]/50 dark:bg-[#0B0F1A]/50 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl shadow-sm">
          No files found in your zero-trust vault.
        </div>
      ) : (
        <div className="bg-[#0B0F1A]/70 dark:bg-[#0B0F1A]/70 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl overflow-hidden shadow-2xl dark:shadow-2xl light:shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono border-b border-slate-800 dark:border-slate-800 light:border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">File & Sensitivity</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Integrity</th>
                  <th className="py-3.5 px-5">Uploaded</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0 shadow-sm">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <p className="font-bold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2">
                            {file.originalFilename}
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> AES-256
                            </span>
                            {renderSensitivityBadge(file.sensitivity)}
                            {file.isHoneyfile && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 text-amber-300 dark:text-amber-300 light:text-amber-700 border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-[10px] font-extrabold tracking-wider">
                                HONEYFILE
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono mt-0.5">ID: {file.id.substring(0, 13)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-800 font-semibold">{formatFileSize(file.size)}</td>
                    <td className="py-4 px-5">
                      {file.integrityStatus === 'OK' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 font-bold text-[10px] tracking-wide">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> SHA-256 Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 font-bold text-[10px] tracking-wide animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 light:text-rose-600" /> TAMPERED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewModalFile(file)}
                          className="p-2 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 hover:bg-purple-500/20 dark:hover:bg-purple-500/20 light:hover:bg-purple-100 text-purple-300 dark:text-purple-300 light:text-purple-700 rounded-xl border border-purple-500/30 dark:border-purple-500/30 light:border-purple-200 transition hover:scale-105 active:scale-95 cursor-pointer"
                          title="Open In-App Secure Viewer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id || file.integrityStatus === 'TAMPERED'}
                          className="p-2 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/20 light:hover:bg-indigo-100 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 rounded-xl border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
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
                          className="p-2 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20 light:hover:bg-emerald-100 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-200 transition hover:scale-105 active:scale-95 cursor-pointer"
                          title="Verify File Integrity (GCM Tag & SHA-256 Checksum)"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectShare(file)}
                          className="p-2 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 light:hover:bg-blue-100 text-blue-300 dark:text-blue-300 light:text-blue-700 rounded-xl border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 transition hover:scale-105 active:scale-95 cursor-pointer"
                          title="Grant or Manage Secure File Shares"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectDetails(file.id)}
                          className="p-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition hover:scale-105 active:scale-95 cursor-pointer"
                          title="Inspect Cryptographic Envelope Parameters"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(file.id)}
                          className="p-2 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 hover:bg-rose-500/20 dark:hover:bg-rose-500/20 light:hover:bg-rose-100 text-rose-400 dark:text-rose-400 light:text-rose-700 rounded-xl border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 transition hover:scale-105 active:scale-95 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* In-App Viewer Modal */}
      {viewModalFile && (
        <FileViewerModal
          isOpen={!!viewModalFile}
          fileId={viewModalFile.id}
          filename={viewModalFile.originalFilename}
          mimeType={viewModalFile.mimeType}
          permission="DOWNLOAD"
          onClose={() => setViewModalFile(null)}
        />
      )}

      {/* Step-Up MFA Challenge Modal */}
      {mfaModalFile && (
        <StepUpMfaModal
          isOpen={!!mfaModalFile}
          onClose={() => setMfaModalFile(null)}
          onSuccess={(stepUpToken) => {
            if (mfaModalFile) {
              handleDownload(mfaModalFile, stepUpToken);
            }
          }}
        />
      )}
    </div>
  );
}
