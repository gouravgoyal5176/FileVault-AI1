import { useState, useEffect } from 'react';
import { apiRequest, getAccessToken } from '../api/apiClient';
import {
  Download,
  Info,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Share2,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
  Lock,
  Trash2,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileViewerModal } from './FileViewerModal';
import { StepUpMfaModal } from './StepUpMfaModal';

export interface SharedWithMeItem {
  shareId: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt: string | null;
  sharedAt: string;
  sharedByEmail: string;
  recipientRisk?: {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    decision: 'ALLOW' | 'VIEW_ONLY' | 'MFA_REQUIRED' | 'BLOCK' | 'RESTRICTED' | 'MFA REQUIRED' | 'BLOCKED';
    reasons?: string[];
    factors?: Array<{ factor: string; points: number; description: string }>;
  };
  file: {
    id: string;
    originalFilename: string;
    size: number;
    mimeType: string;
    sha256Hash: string;
    integrityStatus: 'OK' | 'TAMPERED';
    sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'CRITICAL';
    createdAt: string;
    owner: {
      id: string;
      email: string;
    };
  };
}

export interface SharedByMeItem {
  shareId: string;
  permission: 'VIEW' | 'DOWNLOAD';
  expiresAt: string | null;
  sharedAt: string;
  sharedWithEmail: string;
  sharedByEmail: string;
  file: {
    id: string;
    originalFilename: string;
    size: number;
    mimeType: string;
    sha256Hash: string;
    integrityStatus: 'OK' | 'TAMPERED';
    sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'CRITICAL';
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
  const [activeShareTab, setActiveShareTab] = useState<'with-me' | 'by-me'>('with-me');
  const [sharedWithMeList, setSharedWithMeList] = useState<SharedWithMeItem[]>([]);
  const [sharedByMeList, setSharedByMeList] = useState<SharedByMeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [viewModalTarget, setViewModalTarget] = useState<SharedWithMeItem | null>(null);
  const [mfaModalTarget, setMfaModalTarget] = useState<SharedWithMeItem | null>(null);

  const fetchAllShares = async () => {
    setLoading(true);
    try {
      const [withMeRes, byMeRes] = await Promise.all([
        apiRequest<{ shares: SharedWithMeItem[] }>('/api/shares/shared-with-me'),
        apiRequest<{ shares: SharedByMeItem[] }>('/api/shares/shared-by-me'),
      ]);
      setSharedWithMeList(withMeRes.shares || []);
      setSharedByMeList(byMeRes.shares || []);
    } catch (err: any) {
      console.error('Failed to fetch shared files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllShares();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderSensitivityBadge = (sensitivity?: string) => {
    const level = sensitivity || 'INTERNAL';
    switch (level) {
      case 'PUBLIC':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-50 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 border border-cyan-500/20 dark:border-cyan-500/20 light:border-cyan-200 text-[10px] font-extrabold tracking-wider" title="File Sensitivity: Publicly accessible content">PUBLIC</span>;
      case 'CONFIDENTIAL':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 text-amber-300 dark:text-amber-300 light:text-amber-700 border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-[10px] font-extrabold tracking-wider" title="File Sensitivity: Business confidential document">CONFIDENTIAL</span>;
      case 'RESTRICTED':
        return <span className="px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/10 light:bg-orange-50 text-orange-400 dark:text-orange-400 light:text-orange-700 border border-orange-500/20 dark:border-orange-500/20 light:border-orange-200 text-[10px] font-extrabold tracking-wider" title="File Sensitivity: Restricted PII/financial content">RESTRICTED</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 text-rose-400 dark:text-rose-400 light:text-rose-700 border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 text-[10px] font-extrabold tracking-wider" title="File Sensitivity: Critical security key payload">CRITICAL</span>;
      case 'INTERNAL':
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 dark:bg-slate-500/10 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-500/20 dark:border-slate-500/20 light:border-slate-300 text-[10px] font-extrabold tracking-wider" title="File Sensitivity: Standard document payload">INTERNAL</span>;
    }
  };

  const handleDownload = async (item: SharedWithMeItem, stepUpToken?: string) => {
    if (item.permission !== 'DOWNLOAD' || item.recipientRisk?.decision === 'BLOCKED') return;

    setDownloadingId(item.file.id);
    setDownloadError(null);

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (stepUpToken) {
        headers['x-step-up-token'] = stepUpToken;
      }

      const response = await fetch(`/api/files/${item.file.id}/download`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.mfaRequired) {
          setMfaModalTarget(item);
          setDownloadingId(null);
          return;
        }
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
      setDownloadError(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRevoke = async (shareId: string) => {
    setRevokingId(shareId);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/shares/${shareId}`, { method: 'DELETE' });
      setActionSuccess('File share permission revoked successfully.');
      fetchAllShares();
    } catch (err: any) {
      alert(`Revocation error: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const renderRiskBadge = (risk?: { riskScore: number; riskLevel: string; decision: string; reasons?: string[] }) => {
    const score = risk?.riskScore ?? 0;
    const level = risk?.riskLevel || 'LOW';
    const decision = risk?.decision || 'ALLOW';
    const reasonsTooltip = risk?.reasons?.length ? risk.reasons.join('\n• ') : 'Normal authenticated session';

    let levelStyle = 'bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border-emerald-500/20';
    if (level === 'MEDIUM') levelStyle = 'bg-amber-500/10 text-amber-400 dark:text-amber-400 light:text-amber-700 border-amber-500/20';
    if (level === 'HIGH') levelStyle = 'bg-orange-500/10 text-orange-400 dark:text-orange-400 light:text-orange-700 border-orange-500/20';
    if (level === 'CRITICAL') levelStyle = 'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/20';

    let decStyle = 'bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 border-emerald-500/20';
    if (decision === 'VIEW_ONLY') decStyle = 'bg-amber-500/10 text-amber-400 dark:text-amber-400 light:text-amber-700 border-amber-500/20';
    if (decision === 'MFA_REQUIRED' || decision === 'MFA REQUIRED') decStyle = 'bg-orange-500/10 text-orange-400 dark:text-orange-400 light:text-orange-700 border-orange-500/20';
    if (decision === 'BLOCK' || decision === 'BLOCKED') decStyle = 'bg-rose-500/10 text-rose-400 dark:text-rose-400 light:text-rose-700 border-rose-500/20';

    return (
      <div className="space-y-1 font-sans text-xs">
        <div
          className="flex items-center gap-1.5 cursor-help"
          title={`Recipient Access Risk: ${score}/100 (${level})\n• Access Risk is calculated from the recipient's current account and access behavior. It is independent from the file sensitivity level.\n\nFactors:\n• ${reasonsTooltip}`}
        >
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-1">
            Recipient Risk: <strong className="text-white dark:text-white light:text-slate-900 font-bold">{score}/100</strong>
            <Info className="w-3 h-3 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 shrink-0" />
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold border ${levelStyle}`}>
            {level}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold">Decision:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${decStyle}`}>
            {decision === 'BLOCKED' ? 'BLOCK' : decision}
          </span>
        </div>
      </div>
    );
  };

  const filteredWithMe = sharedWithMeList.filter(
    (item) =>
      item.file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sharedByEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredByMe = sharedByMeList.filter(
    (item) =>
      item.file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sharedWithEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-4 sm:px-6 shadow-xl light:shadow-md light:shadow-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl border border-indigo-500/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base tracking-tight">Shared File Vault</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Collaborative zero-trust permissions boundary</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100 p-1.5 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <button
              onClick={() => setActiveShareTab('with-me')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeShareTab === 'with-me'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Shared With Me ({filteredWithMe.length})</span>
            </button>

            <button
              onClick={() => setActiveShareTab('by-me')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeShareTab === 'by-me'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Shared By Me ({filteredByMe.length})</span>
            </button>
          </div>

          <button
            onClick={fetchAllShares}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#121829] dark:bg-[#121829] light:bg-white text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-200 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 text-xs rounded-2xl flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {downloadError && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 text-rose-300 dark:text-rose-300 light:text-rose-800 text-xs rounded-2xl flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* TAB 1: SHARED WITH ME */}
      {activeShareTab === 'with-me' && (
        <>
          {loading ? (
            <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredWithMe.length === 0 ? (
            <div className="py-16 text-center border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm space-y-3 shadow-xl light:shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-white dark:text-white light:text-slate-900 text-base">No shared files found</p>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-sm mx-auto">
                {searchQuery ? `No files shared with you match "${searchQuery}"` : 'Encrypted files shared with your account by other vault users will appear here.'}
              </p>
            </div>
          ) : (
            <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl overflow-hidden shadow-xl light:shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
                  <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-5">File &amp; Sensitivity</th>
                      <th className="py-3.5 px-5">Shared By</th>
                      <th className="py-3.5 px-5">Permission</th>
                      <th className="py-3.5 px-5">Dynamic Risk &amp; Access</th>
                      <th className="py-3.5 px-5">Size</th>
                      <th className="py-3.5 px-5">Expiration</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                    <AnimatePresence>
                      {filteredWithMe.map((item) => (
                        <motion.tr
                          key={item.shareId}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="hover:bg-[#121829]/70 dark:hover:bg-[#121829]/70 light:hover:bg-slate-50 transition-colors duration-150"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0">
                                <FileText className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-bold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2">
                                  {item.file.originalFilename}
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> AES-256
                                  </span>
                                  {renderSensitivityBadge(item.file.sensitivity)}
                                </p>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  ID: {item.file.id.substring(0, 13)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">{item.sharedByEmail}</td>
                          <td className="py-4 px-5">
                            {item.permission === 'DOWNLOAD' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 font-extrabold text-[10px] tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> DOWNLOAD
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 text-purple-300 dark:text-purple-300 light:text-purple-700 border border-purple-500/20 dark:border-purple-500/20 light:border-purple-200 font-extrabold text-[10px] tracking-wider">
                                <ShieldAlert className="w-3.5 h-3.5 text-purple-400 light:text-purple-600" /> VIEW ONLY
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            {renderRiskBadge(item.recipientRisk)}
                          </td>
                          <td className="py-4 px-5 font-mono font-semibold text-slate-300 dark:text-slate-300 light:text-slate-800">{formatFileSize(item.file.size)}</td>
                          <td className="py-4 px-5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                            {item.expiresAt ? (
                              <span className="flex items-center gap-1.5 text-amber-300 dark:text-amber-300 light:text-amber-800 font-bold bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" /> {new Date(item.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-500 light:text-slate-400">Never</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.recipientRisk?.decision === 'BLOCK' || item.recipientRisk?.decision === 'BLOCKED' ? (
                                <span
                                  className="px-3 py-1.5 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 text-rose-400 dark:text-rose-400 light:text-rose-700 rounded-xl border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-75"
                                  title="Access temporarily blocked due to elevated security risk."
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                  <span>🔒 Access Blocked</span>
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setViewModalTarget(item)}
                                    className="px-3 py-1.5 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 hover:bg-purple-500/20 dark:hover:bg-purple-500/20 light:hover:bg-purple-100 text-purple-300 dark:text-purple-300 light:text-purple-700 rounded-xl border border-purple-500/30 dark:border-purple-500/30 light:border-purple-200 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                    title="Open secure in-app document viewer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-purple-400 light:text-purple-600" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(item)}
                                    disabled={
                                      downloadingId === item.file.id ||
                                      item.permission !== 'DOWNLOAD' ||
                                      item.recipientRisk?.decision === 'VIEW_ONLY'
                                    }
                                    className="p-2 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/20 light:hover:bg-indigo-100 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 rounded-xl border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={
                                      item.recipientRisk?.decision === 'VIEW_ONLY'
                                        ? 'Download restricted by adaptive policy (Downgraded to View-Only)'
                                        : item.permission === 'DOWNLOAD'
                                        ? 'Decrypt & download file'
                                        : 'Download prohibited for VIEW-only share'
                                    }
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onSelectDetails(item.file.id)}
                                className="p-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title="Inspect Cryptographic Envelope Details"
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
        </>
      )}

      {/* TAB 2: SHARED BY ME */}
      {activeShareTab === 'by-me' && (
        <>
          {loading ? (
            <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredByMe.length === 0 ? (
            <div className="py-16 text-center border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm space-y-3 shadow-xl light:shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-white dark:text-white light:text-slate-900 text-base">No active granted shares</p>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-sm mx-auto">
                {searchQuery ? `No active shares match "${searchQuery}"` : 'Files you share with other users will appear here for permission management.'}
              </p>
            </div>
          ) : (
            <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl overflow-hidden shadow-xl light:shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
                  <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-5">File &amp; Sensitivity</th>
                      <th className="py-3.5 px-5">Shared With</th>
                      <th className="py-3.5 px-5">Permission Granted</th>
                      <th className="py-3.5 px-5">Expiration</th>
                      <th className="py-3.5 px-5 text-right">Revoke Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                    <AnimatePresence>
                      {filteredByMe.map((item) => (
                        <motion.tr
                          key={item.shareId}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="hover:bg-[#121829]/70 dark:hover:bg-[#121829]/70 light:hover:bg-slate-50 transition-colors duration-150"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0">
                                <FileText className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-bold text-white dark:text-white light:text-slate-900 text-sm flex items-center gap-2">
                                  {item.file.originalFilename}
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-[10px] font-extrabold tracking-wider flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> AES-256
                                  </span>
                                  {renderSensitivityBadge(item.file.sensitivity)}
                                </p>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  ID: {item.file.id.substring(0, 13)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">{item.sharedWithEmail}</td>
                          <td className="py-4 px-5">
                            {item.permission === 'DOWNLOAD' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 font-extrabold text-[10px] tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" /> DOWNLOAD
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 text-purple-300 dark:text-purple-300 light:text-purple-700 border border-purple-500/20 dark:border-purple-500/20 light:border-purple-200 font-extrabold text-[10px] tracking-wider">
                                <ShieldAlert className="w-3.5 h-3.5 text-purple-400 light:text-purple-600" /> VIEW ONLY
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
                            {item.expiresAt ? (
                              <span className="flex items-center gap-1.5 text-amber-300 dark:text-amber-300 light:text-amber-800 font-bold bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" /> {new Date(item.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-500 light:text-slate-400">Never</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => handleRevoke(item.shareId)}
                              disabled={revokingId === item.shareId}
                              className="px-3 py-1.5 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 hover:bg-rose-500/20 dark:hover:bg-rose-500/20 light:hover:bg-rose-100 text-rose-400 dark:text-rose-400 light:text-rose-700 rounded-xl border border-rose-500/30 dark:border-rose-500/30 light:border-rose-200 transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs flex items-center gap-1.5 ml-auto disabled:opacity-40"
                              title="Revoke recipient access immediately"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{revokingId === item.shareId ? 'Revoking...' : 'Revoke'}</span>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* In-App Viewer Modal */}
      {viewModalTarget && (
        <FileViewerModal
          isOpen={!!viewModalTarget}
          fileId={viewModalTarget.file.id}
          filename={viewModalTarget.file.originalFilename}
          mimeType={viewModalTarget.file.mimeType}
          permission={viewModalTarget.permission}
          viewerEmail={viewModalTarget.sharedByEmail}
          onClose={() => setViewModalTarget(null)}
        />
      )}

      {/* Step-Up MFA Challenge Modal */}
      {mfaModalTarget && (
        <StepUpMfaModal
          isOpen={!!mfaModalTarget}
          fileId={mfaModalTarget.file.id}
          filename={mfaModalTarget.file.originalFilename}
          riskLevel={mfaModalTarget.recipientRisk?.riskLevel}
          fileSensitivity={mfaModalTarget.file.sensitivity}
          onClose={() => setMfaModalTarget(null)}
          onSuccess={(stepUpToken) => {
            if (mfaModalTarget) {
              handleDownload(mfaModalTarget, stepUpToken);
            }
          }}
        />
      )}
    </div>
  );
}
