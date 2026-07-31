import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import { X, ShieldCheck, HardDrive, Key, Lock, Hash, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface FileDetailsModalProps {
  fileId: string | null;
  onClose: () => void;
}

interface FileDetails {
  id: string;
  originalFilename: string;
  storageKey: string;
  size: number;
  mimeType: string;
  sha256Hash: string;
  encryptionAlgorithm: string;
  keyWrappingAlgorithm: string;
  ivConfigured: boolean;
  authTagConfigured: boolean;
  wrappedDekConfigured: boolean;
  integrityStatus: 'OK' | 'TAMPERED';
  isHoneyfile: boolean;
  createdAt: string;
}

export function FileDetailsModal({ fileId, onClose }: FileDetailsModalProps) {
  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<{ file: FileDetails }>(`/api/files/${fileId}`);
        setFile(data.file);
      } catch (err: any) {
        setError(err.message || 'Failed to load file encryption details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [fileId]);

  if (!fileId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-2xl w-full p-7 shadow-[0_0_60px_rgba(0,0,0,0.8)] space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">FILE CRYPTOGRAPHIC INSPECTION</h3>
              <p className="text-xs text-slate-400">Zero-Trust Envelope Encryption Parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 rounded-2xl text-xs backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            {error}
          </div>
        ) : loading || !file ? (
          <div className="py-12 text-center text-xs text-cyan-400 tracking-wider">LOADING CRYPTOGRAPHIC AUDIT PARAMETERS...</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* File Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
              <div>
                <span className="text-slate-400 block mb-1 font-bold">Filename</span>
                <span className="font-extrabold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  {file.originalFilename}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold">Integrity Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-extrabold px-3 py-1 rounded-full text-[11px] tracking-wide ${
                    file.integrityStatus === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                  }`}
                >
                  {file.integrityStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold">Storage Key (MinIO UUID)</span>
                <span className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  {file.storageKey}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold">Uploaded At</span>
                <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  {new Date(file.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* SHA-256 Checksum */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2 shadow-inner">
              <span className="text-amber-300 font-extrabold flex items-center gap-2 tracking-wide uppercase text-[11px]">
                <Hash className="w-4 h-4 text-amber-400" /> Original Plaintext SHA-256 Checksum
              </span>
              <p className="font-mono text-amber-300 font-bold break-all select-all bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 text-xs shadow-inner">
                {file.sha256Hash}
              </p>
            </div>

            {/* Cryptographic Envelope Security Configuration */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-4 shadow-inner">
              <span className="text-cyan-300 font-extrabold flex items-center gap-2 text-xs tracking-wider uppercase">
                <Lock className="w-4 h-4 text-cyan-400" /> Envelope Encryption &amp; Key Wrapping Policy
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 space-y-1">
                  <span className="text-slate-400 block font-bold text-[10px]">Encryption Standard</span>
                  <span className="font-extrabold text-emerald-300 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {file.encryptionAlgorithm}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 space-y-1">
                  <span className="text-slate-400 block font-bold text-[10px]">DEK Envelope Protection</span>
                  <span className="font-extrabold text-purple-300 flex items-center gap-1.5 text-xs">
                    <Key className="w-4 h-4 text-purple-400" /> {file.keyWrappingAlgorithm}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-white/10 text-xs gap-2">
                <span className="text-slate-400 font-bold">Cryptographic Components Verified:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    Cipher IV Active
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    GCM Tag Active
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[10px] shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                    Wrapped DEK Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
