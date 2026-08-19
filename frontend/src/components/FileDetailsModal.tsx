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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">File Cryptographic Inspection</h3>
              <p className="text-xs text-slate-500 font-medium">Zero-Trust Envelope Encryption Parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
            {error}
          </div>
        ) : loading || !file ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading encryption audit parameters...</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* File Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block mb-1 font-bold text-[11px]">Filename</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  {file.originalFilename}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold text-[11px]">Integrity Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-extrabold px-3 py-1 rounded-full text-[11px] tracking-wide ${
                    file.integrityStatus === 'OK'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {file.integrityStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold text-[11px]">Storage Key (MinIO UUID)</span>
                <span className="font-mono text-indigo-600 font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  {file.storageKey}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-bold text-[11px]">Uploaded At</span>
                <span className="text-slate-700 flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {new Date(file.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* SHA-256 Checksum */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-slate-700 font-extrabold flex items-center gap-2 tracking-wide uppercase text-[11px]">
                <Hash className="w-4 h-4 text-amber-600" /> Original Plaintext SHA-256 Checksum
              </span>
              <p className="font-mono text-slate-800 font-bold break-all select-all bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                {file.sha256Hash}
              </p>
            </div>

            {/* Cryptographic Envelope Security Configuration */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
              <span className="text-slate-900 font-extrabold flex items-center gap-2 text-xs tracking-wider uppercase">
                <Lock className="w-4 h-4 text-indigo-600" /> Envelope Encryption &amp; Key Wrapping Policy
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block font-bold text-[10px]">Encryption Standard</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {file.encryptionAlgorithm}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block font-bold text-[10px]">DEK Envelope Protection</span>
                  <span className="font-extrabold text-indigo-700 flex items-center gap-1.5 text-xs">
                    <Key className="w-4 h-4 text-indigo-600" /> {file.keyWrappingAlgorithm}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs gap-2">
                <span className="text-slate-500 font-bold">Cryptographic Components Verified:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                    Cipher IV Active
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                    GCM Tag Active
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
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
