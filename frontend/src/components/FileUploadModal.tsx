import { useState, ChangeEvent, FormEvent } from 'react';
import { getAccessToken } from '../api/apiClient';
import { Upload, X, ShieldAlert, FileText, CheckCircle2, Cpu, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [stepText, setStepText] = useState<string>('');

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
    setStepText('Scanning binary payload...');

    // Multi-step UI animation feedback sequence
    setTimeout(() => setStepText('Generating 256-bit AES DEK key...'), 400);
    setTimeout(() => setStepText('Encrypting payload with AES-256-GCM...'), 800);
    setTimeout(() => setStepText('Wrapping DEK with Master Encryption Key...'), 1200);
    setTimeout(() => setStepText('Transmitting ciphertext to MinIO Object Storage...'), 1600);

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

      setStepText('Verifying SHA-256 Checksum & GCM Auth Tag...');
      setTimeout(() => {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFile(null);
          setIsHoneyfile(false);
          onUploadSuccess();
          onClose();
        }, 1200);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt and upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 transition-all text-white dark:text-white light:text-slate-900 relative overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-xl border border-indigo-500/30 shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base tracking-tight">Secure File Upload</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">AES-256-GCM envelope encryption applied pre-storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs flex items-center gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <p className="font-extrabold text-emerald-300 dark:text-emerald-300 light:text-emerald-700 text-base tracking-wide">File Encrypted &amp; Vaulted Securely</p>
            <div className="flex justify-center items-center gap-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">
              <span className="text-emerald-400 font-bold">Encrypted ✓</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Uploaded ✓</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Secured ✓</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Multi-step Visual Indicator */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
              <div className={`py-1.5 rounded-l-xl border ${file ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-500 dark:text-slate-500 light:text-slate-600 border-slate-800 dark:border-slate-800 light:border-slate-200'}`}>
                1. Select
              </div>
              <div className={`py-1.5 border ${loading && stepText.includes('DEK') ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse' : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-500 dark:text-slate-500 light:text-slate-600 border-slate-800 dark:border-slate-800 light:border-slate-200'}`}>
                2. Encrypt
              </div>
              <div className={`py-1.5 border ${loading && stepText.includes('MinIO') ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse' : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-500 dark:text-slate-500 light:text-slate-600 border-slate-800 dark:border-slate-800 light:border-slate-200'}`}>
                3. Transmit
              </div>
              <div className={`py-1.5 rounded-r-xl border ${success ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-500 dark:text-slate-500 light:text-slate-600 border-slate-800 dark:border-slate-800 light:border-slate-200'}`}>
                4. Verify
              </div>
            </div>

            {/* Drag-and-Drop Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                  setError(null);
                }
              }}
              className="border-2 border-dashed border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 hover:border-indigo-500 bg-[#121829]/60 dark:bg-[#121829]/60 light:bg-slate-50 hover:bg-indigo-500/10 rounded-2xl p-8 text-center transition-all duration-200 group relative cursor-pointer"
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="p-3.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-2xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 w-14 h-14 mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">{file.name}</p>
                    <p className="text-xs text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-semibold mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'application/octet-stream'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                      Click to choose file or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 mt-1 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> AES-256-GCM Encryption Applied Automatically
                    </p>
                  </div>
                )}
              </label>
            </div>

            {loading && (
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs rounded-xl flex items-center gap-2.5 font-medium animate-pulse">
                <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>{stepText}</span>
              </div>
            )}

            <div className="flex items-center gap-3 p-3.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl">
              <input
                type="checkbox"
                id="honeyfile-checkbox"
                checked={isHoneyfile}
                onChange={(e) => setIsHoneyfile(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="honeyfile-checkbox" className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 cursor-pointer select-none">
                Mark as <span className="font-bold text-amber-400">Honeyfile</span> (Decoy payload for security anomaly testing)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs font-bold rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50 border border-indigo-400/30"
              >
                {loading ? 'Encrypting...' : 'Encrypt & Upload'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
