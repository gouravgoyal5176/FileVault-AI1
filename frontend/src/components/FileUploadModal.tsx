import { useState, ChangeEvent, FormEvent } from 'react';
import { getAccessToken } from '../api/apiClient';
import { Upload, X, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function FileUploadModal({ isOpen, onClose, onUploadSuccess }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isHoneyfile, setIsHoneyfile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isHoneyfile', String(isHoneyfile));

      const token = getAccessToken();
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('File payload size exceeds maximum server upload limit (413 Payload Too Large).');
        }
        throw new Error(data.error || data.message || `File upload failed with status ${response.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setIsHoneyfile(false);
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt and upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-lg w-full p-7 shadow-[0_0_60px_rgba(0,0,0,0.8)] space-y-5 transition-all">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Upload className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">UPLOAD ENCRYPTED FILE</h3>
              <p className="text-xs text-slate-400">AES-256-GCM envelope encryption pre-storage</p>
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
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce filter drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
            <p className="font-extrabold text-emerald-300 text-base tracking-wide">FILE ENCRYPTED &amp; VAULTED SECURELY</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* High-Tech Scanning Area */}
            <div className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-b from-cyan-950/20 to-slate-950/60 rounded-2xl p-8 text-center transition-all duration-300 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[inset_0_0_40px_rgba(34,211,238,0.2)] group relative overflow-hidden">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block relative z-10">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/30 w-16 h-16 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.25)] group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">{file.name}</p>
                    <p className="text-xs text-cyan-300 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'application/octet-stream'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-extrabold text-slate-100 tracking-wide">
                      CLICK TO CHOOSE FILE OR DRAG &amp; DROP
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports any binary format up to 50MB</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl">
              <input
                type="checkbox"
                id="honeyfile-checkbox"
                checked={isHoneyfile}
                onChange={(e) => setIsHoneyfile(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-white/20 focus:ring-cyan-500"
              />
              <label htmlFor="honeyfile-checkbox" className="text-xs text-slate-300 cursor-pointer select-none">
                Mark as <span className="font-extrabold text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]">Honeyfile</span> (Decoy file for threat detection testing)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition hover:scale-105 active:scale-95"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'ENCRYPTING & UPLOADING...' : 'ENCRYPT & UPLOAD'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
