import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { Navbar } from './components/Navbar';
import { FileUploadModal } from './components/FileUploadModal';
import { FileDetailsModal } from './components/FileDetailsModal';
import { ShareFileModal } from './components/ShareFileModal';
import { SharedWithMe } from './components/SharedWithMe';
import { ThreatAlertsWidget } from './components/ThreatAlertsWidget';
import { SecurityCenter } from './components/SecurityCenter';
import { FileList, FileItem } from './components/FileList';
import { apiRequest } from './api/apiClient';
import { Shield, RefreshCw, Upload, HardDrive, UserCheck, Activity, AlertTriangle } from 'lucide-react';

function MainAppContent() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'my-files' | 'shared-with-me' | 'security-center'>('my-files');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [shareFileTarget, setShareFileTarget] = useState<FileItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    setFilesLoading(true);
    setActionError(null);
    try {
      const data = await apiRequest<{ files: FileItem[] }>('/api/files');
      setFiles(data.files);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch vault files');
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to permanently delete this encrypted file?')) return;
    try {
      await apiRequest(`/api/files/${fileId}`, { method: 'DELETE' });
      fetchFiles();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="font-mono text-cyan-300 tracking-wider">INITIALIZING CRYPTOGRAPHIC SESSION...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {!user ? (
        <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          {mode === 'login' ? (
            <LoginPage onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterPage onSwitchToLogin={() => setMode('login')} />
          )}
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(14,165,233,0.12)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 hover:border-cyan-500/30">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-2xl border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                <Shield className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Zero-Trust Encrypted File Vault
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">AES-256-GCM</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Envelope Encryption • AI Behavioral Threat Telemetry • Deterministic Security Posture Analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={async () => {
                  try {
                    const data = await apiRequest('/api/files/verify-all', { method: 'POST' });
                    alert(`[VAULT AUDIT COMPLETE]\nTotal Files: ${data.totalFiles}\nIntegrity OK: ${data.okCount}\nTampered: ${data.tamperedCount}`);
                    fetchFiles();
                  } catch (err: any) {
                    alert(`Audit failed: ${err.message}`);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.35)] hover:scale-105 transition-all duration-300 active:scale-95"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                Audit All Vault Files
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-105 transition-all duration-300 active:scale-95 tracking-wider uppercase"
              >
                <Upload className="w-4 h-4 stroke-[3]" />
                Upload Encrypted File
              </button>
            </div>
          </div>

          {/* Behavioral Threat Detection Monitor Widget */}
          <ThreatAlertsWidget />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-mono tracking-wider">
            <button
              onClick={() => setActiveTab('my-files')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                activeTab === 'my-files'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/20'
              }`}
            >
              <HardDrive className={`w-4 h-4 ${activeTab === 'my-files' ? 'text-cyan-400' : ''}`} />
              MY VAULT FILES ({files.length})
            </button>

            <button
              onClick={() => setActiveTab('shared-with-me')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                activeTab === 'shared-with-me'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/20'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeTab === 'shared-with-me' ? 'text-cyan-400' : ''}`} />
              SHARED WITH ME
            </button>

            <button
              onClick={() => setActiveTab('security-center')}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold ${
                activeTab === 'security-center'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/20'
              }`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'security-center' ? 'text-cyan-400' : ''}`} />
              SECURITY CENTER & AUDIT
            </button>
          </div>

          {actionError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-300 rounded-2xl text-xs flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'my-files' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                  <HardDrive className="w-5 h-5 text-cyan-400" />
                  My Encrypted Files ({files.length})
                </h3>

                <button
                  onClick={fetchFiles}
                  disabled={filesLoading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono font-medium text-slate-300 rounded-xl border border-white/10 transition-all hover:border-cyan-500/40 hover:scale-105 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${filesLoading ? 'animate-spin' : ''}`} />
                  REFRESH VAULT
                </button>
              </div>

              <FileList
                files={files}
                loading={filesLoading}
                onRefresh={fetchFiles}
                onSelectDetails={(id) => setSelectedFileId(id)}
                onSelectShare={(file) => setShareFileTarget(file)}
                onDelete={handleDelete}
              />
            </div>
          ) : activeTab === 'shared-with-me' ? (
            <SharedWithMe onSelectDetails={(id) => setSelectedFileId(id)} />
          ) : (
            <SecurityCenter />
          )}

          {/* Modals */}
          <FileUploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onUploadSuccess={fetchFiles}
          />

          <FileDetailsModal
            fileId={selectedFileId}
            onClose={() => setSelectedFileId(null)}
          />

          <ShareFileModal
            fileId={shareFileTarget?.id || null}
            filename={shareFileTarget?.originalFilename || ''}
            onClose={() => setShareFileTarget(null)}
          />
        </main>
      )}

      {/* Global Futuristic Footer */}
      <footer className="border-t border-white/10 py-5 px-6 bg-slate-950/80 backdrop-blur-md text-center text-xs text-slate-400 font-mono space-y-1">
        <div className="flex items-center justify-center gap-2 text-cyan-300/90 font-medium tracking-wide">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Made by Gourav Goyal, Saurabh Singh Rawat &amp; Bhaskar Raj Singh Thakur</span>
        </div>
        <p className="text-[11px] text-slate-400/80">
          FileVault AI Zero-Trust Cybernetic Architecture &copy; 2026 Academic Cybersecurity Project. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
