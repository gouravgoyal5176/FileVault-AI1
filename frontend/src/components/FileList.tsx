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
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('html'))
      return <FileCode className="w-5 h-5 text-amber-600" />;
    return <FileText className="w-5 h-5 text-blue-600" />;
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
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Search encrypted vault files by name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {downloadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* File List Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Polling encrypted vault files...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center border border-slate-200/80 rounded-3xl bg-white text-slate-500 text-sm space-y-2 shadow-xs">
          <p className="font-bold text-slate-800 text-base">No encrypted files found</p>
          <p className="text-xs text-slate-400">Upload a file to encrypt with AES-256-GCM envelope encryption.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">File &amp; Encryption Badges</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Integrity Status</th>
                  <th className="py-3.5 px-5">Uploaded</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/60 transition-all duration-150">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {file.originalFilename}
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> AES-256
                            </span>
                            {file.isHoneyfile && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold tracking-wider">
                                HONEYFILE
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {file.id.substring(0, 13)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-600 font-semibold">{formatFileSize(file.size)}</td>
                    <td className="py-4 px-5">
                      {file.integrityStatus === 'OK' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] tracking-wide">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] tracking-wide animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> TAMPERED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id || file.integrityStatus === 'TAMPERED'}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
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
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Verify File Integrity (GCM Tag & SHA-256 Checksum)"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectShare(file)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Grant or Manage Secure File Shares"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectDetails(file.id)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Inspect Cryptographic Envelope Parameters"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(file.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
    </div>
  );
}
