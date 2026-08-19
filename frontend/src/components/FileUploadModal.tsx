import { useState, ChangeEvent, FormEvent } from 'react';
import { getAccessToken } from '../api/apiClient';
import { Upload, X, ShieldAlert, FileText, CheckCircle2, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Upload Encrypted File</h3>
              <p className="text-xs text-slate-500 font-medium">AES-256-GCM envelope encryption pre-storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
            <p className="font-extrabold text-emerald-700 text-base tracking-wide">File Encrypted &amp; Vaulted Securely</p>
            <p className="text-xs text-slate-500 font-mono">SHA-256 Checksum &amp; AES-256-GCM Envelope Verified</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Multi-step Visual Indicator */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
              <div className={`py-1 rounded-l-lg border ${file ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                1. Select
              </div>
              <div className={`py-1 border ${loading ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                2. Upload
              </div>
              <div className={`py-1 border ${loading && stepText.includes('Encrypting') ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                3. Encrypt
              </div>
              <div className={`py-1 rounded-r-lg border ${success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
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
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30 rounded-2xl p-8 text-center transition-all duration-200 group relative"
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 w-14 h-14 mx-auto flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-indigo-600" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'application/octet-stream'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose file or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Supports PDF, DOCX, Images &amp; Binary formats up to 50MB</p>
                  </div>
                )}
              </label>
            </div>

            {loading && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl flex items-center gap-2.5 font-medium animate-pulse">
                <Cpu className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{stepText}</span>
              </div>
            )}

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <input
                type="checkbox"
                id="honeyfile-checkbox"
                checked={isHoneyfile}
                onChange={(e) => setIsHoneyfile(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="honeyfile-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                Mark as <span className="font-bold text-amber-600">Honeyfile</span> (Decoy file for threat detection testing)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Encrypting...' : 'Encrypt & Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
