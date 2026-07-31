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
}

export function FileList({ files, loading, onRefresh, onSelectDetails, onSelectShare, onDelete }: FileListProps) {
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const filteredFiles = files.filter((f) =>
    f.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-cyan-400" />;
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
      onRefresh(); // Refresh list in case status updated to TAMPERED
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search encrypted vault files by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {downloadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* File List Table */}
      {loading ? (
        <div className="py-16 text-center text-cyan-400 text-xs tracking-wider flex items-center justify-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>POLLING VAULT CIPHERTEXT RECORDS...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center border border-white/10 rounded-3xl bg-slate-900/30 backdrop-blur-xl text-slate-400 text-sm space-y-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <p className="font-extrabold text-white text-base">NO ENCRYPTED FILES FOUND</p>
          <p className="text-xs text-slate-400">Upload a file to encrypt with AES-256-GCM envelope encryption.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-5">File Name &amp; Meta</th>
                  <th className="py-4 px-5">Size</th>
                  <th className="py-4 px-5">Integrity Status</th>
                  <th className="py-4 px-5">Uploaded</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 shrink-0 shadow-inner">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm flex items-center gap-2 tracking-tight">
                            {file.originalFilename}
                            {file.isHoneyfile && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                HONEYFILE
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400/80">ID: {file.id.substring(0, 13)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-300 font-semibold">{formatFileSize(file.size)}</td>
                    <td className="py-4 px-5">
                      {file.integrityStatus === 'OK' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] tracking-wide shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> OK (VERIFIED)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px] tracking-wide shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> TAMPERED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-slate-400 font-mono">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id || file.integrityStatus === 'TAMPERED'}
                          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.2)] disabled:opacity-40"
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
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                          title="Verify File Integrity (GCM Tag & SHA-256 Checksum)"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectShare(file)}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:border-blue-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                          title="Grant or Manage Secure File Shares"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectDetails(file.id)}
                          className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:scale-110 active:scale-95"
                          title="Inspect Cryptographic Envelope Parameters"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(file.id)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-500/30 hover:border-rose-500/60 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
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
