import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { UserLayout } from './layout/UserLayout';
import { UserNavTab } from './layout/UserSidebar';
import { AdminLayout } from './layout/AdminLayout';
import { AdminNavSection } from './layout/AdminSidebar';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { StorageCard } from './components/dashboard/StorageCard';
import { SecurityScoreCard } from './components/dashboard/SecurityScoreCard';
import { ThreatLevelCard } from './components/dashboard/ThreatLevelCard';
import { QuickActions } from './components/dashboard/QuickActions';
import { ActivityTimeline } from './components/dashboard/ActivityTimeline';
import { FileList, FileItem } from './components/FileList';
import { SharedWithMe } from './components/SharedWithMe';
import { SecurityCenter } from './components/SecurityCenter';
import { SupportCenter } from './components/SupportCenter';
import { ThreatAlertsWidget } from './components/ThreatAlertsWidget';
import { AnomalyMonitorWidget } from './components/AnomalyMonitorWidget';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { SettingsPage } from './components/pages/SettingsPage';
import { FileUploadModal } from './components/FileUploadModal';
import { FileDetailsModal } from './components/FileDetailsModal';
import { ShareFileModal } from './components/ShareFileModal';
import { apiRequest } from './api/apiClient';
import { RefreshCw, ShieldCheck } from 'lucide-react';

function MainAppContent() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'admin-login'>('login');

  // User State
  const [userActiveTab, setUserActiveTab] = useState<UserNavTab>('dashboard');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Admin State
  const [adminActiveSection, setAdminActiveSection] = useState<AdminNavSection>('admin-overview');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Dashboard Data State (for normal users)
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState<boolean>(false);
  const [threatSummary, setThreatSummary] = useState<any>(null);
  const [threatLoading, setThreatLoading] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [shareFileTarget, setShareFileTarget] = useState<FileItem | null>(null);

  const fetchFiles = async () => {
    if (!user || user.role === 'ADMIN') return;
    setFilesLoading(true);
    try {
      const data = await apiRequest<{ files: FileItem[] }>('/api/files');
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchScore = async () => {
    if (!user || user.role === 'ADMIN') return;
    setScoreLoading(true);
    try {
      const data = await apiRequest<any>('/api/security-center/score');
      setScoreData(data);
    } catch {
      setScoreData(null);
    } finally {
      setScoreLoading(false);
    }
  };

  const fetchThreats = async () => {
    if (!user || user.role === 'ADMIN') return;
    setThreatLoading(true);
    try {
      const data = await apiRequest<any>('/api/threats/summary');
      setThreatSummary(data);
    } catch {
      setThreatSummary(null);
    } finally {
      setThreatLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!user || user.role === 'ADMIN') return;
    setLogsLoading(true);
    try {
      const data = await apiRequest<{ logs: any[] }>('/api/security-center/audit-logs?limit=10');
      setAuditLogs(data.logs || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const refreshAllData = () => {
    fetchFiles();
    fetchScore();
    fetchThreats();
    fetchLogs();
  };

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      refreshAllData();
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

  // Compute storage used
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

  // Filter files by search query (originalFilename, storageKey, mimeType, sha256Hash)
  const filteredFiles = files.filter((f) => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.originalFilename.toLowerCase().includes(q) ||
      f.storageKey.toLowerCase().includes(q) ||
      (f.mimeType && f.mimeType.toLowerCase().includes(q)) ||
      (f.sha256Hash && f.sha256Hash.toLowerCase().includes(q))
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center text-slate-400 text-sm select-none">
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#0B0F1A] border border-indigo-500/30 shadow-2xl">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="font-mono text-indigo-300 tracking-wider">INITIALIZING CRYPTOGRAPHIC SESSION...</span>
        </div>
      </div>
    );
  }

  // Logged-Out Unauthenticated Auth Flow
  if (!user) {
    if (mode === 'admin-login') {
      return <AdminLoginPage onSwitchToUserLogin={() => setMode('login')} />;
    }
    return mode === 'login' ? (
      <LoginPage
        onSwitchToRegister={() => setMode('register')}
        onSwitchToAdminLogin={() => setMode('admin-login')}
      />
    ) : (
      <RegisterPage onSwitchToLogin={() => setMode('login')} />
    );
  }

  // =========================================================================
  // ADMIN CONSOLE EXPERIENCE (ADMIN ROLE ONLY)
  // Completely separated layout, sidebar & navigation for System Administrators
  // =========================================================================
  if (user.role === 'ADMIN') {
    return (
      <AdminLayout
        activeSection={adminActiveSection}
        setActiveSection={setAdminActiveSection}
        adminSearchQuery={adminSearchQuery}
        setAdminSearchQuery={setAdminSearchQuery}
      >
        <AdminDashboard
          activeSection={adminActiveSection}
          setActiveSection={setAdminActiveSection}
          adminSearchQuery={adminSearchQuery}
        />
      </AdminLayout>
    );
  }

  // =========================================================================
  // USER VAULT DASHBOARD EXPERIENCE (USER ROLE ONLY)
  // Dedicated user layout, sidebar & navigation for file storage & security
  // =========================================================================
  return (
    <UserLayout
      activeTab={userActiveTab}
      setActiveTab={setUserActiveTab}
      onOpenUpload={() => setUploadModalOpen(true)}
      searchQuery={userSearchQuery}
      setSearchQuery={setUserSearchQuery}
    >
      {userActiveTab === 'dashboard' && (
        <div className="space-y-6">
          <HeroBanner
            onOpenUpload={() => setUploadModalOpen(true)}
            onNavigateSecurity={() => setUserActiveTab('security')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StorageCard totalBytes={totalBytes} fileCount={files.length} />
            <SecurityScoreCard
              score={scoreData}
              loading={scoreLoading}
              onRefresh={fetchScore}
              onNavigateSecurity={() => setUserActiveTab('security')}
            />
            <ThreatLevelCard
              summary={threatSummary}
              loading={threatLoading}
              onRefresh={fetchThreats}
              onNavigateThreats={() => setUserActiveTab('threats')}
            />
          </div>

          <QuickActions
            onOpenUpload={() => setUploadModalOpen(true)}
            onRefresh={refreshAllData}
            onNavigateSecurity={() => setUserActiveTab('security')}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Recent Vault Files ({filteredFiles.length})
              </h3>
              <button
                onClick={() => setUserActiveTab('vault')}
                className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 dark:hover:text-indigo-300 light:hover:text-indigo-700 transition cursor-pointer"
              >
                View All Vault Files →
              </button>
            </div>
            <FileList
              files={filteredFiles.slice(0, 5)}
              loading={filesLoading}
              onRefresh={fetchFiles}
              onSelectDetails={(id) => setSelectedFileId(id)}
              onSelectShare={(file) => setShareFileTarget(file)}
              onDelete={handleDelete}
            />
          </div>

          <ActivityTimeline logs={auditLogs.slice(0, 5)} loading={logsLoading} />
        </div>
      )}

      {userActiveTab === 'vault' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white dark:text-white light:text-slate-900">Encrypted Vault Storage</h3>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition cursor-pointer"
              >
                + Upload Encrypted File
              </button>
            </div>
            <FileList
              files={filteredFiles}
              loading={filesLoading}
              onRefresh={fetchFiles}
              onSelectDetails={(id) => setSelectedFileId(id)}
              onSelectShare={(file) => setShareFileTarget(file)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {userActiveTab === 'shared' && (
        <SharedWithMe onSelectDetails={(id) => setSelectedFileId(id)} searchQuery={userSearchQuery} />
      )}

      {userActiveTab === 'security' && <SecurityCenter />}

      {userActiveTab === 'threats' && (
        <div className="space-y-6">
          <ThreatAlertsWidget />
          <AnomalyMonitorWidget />
        </div>
      )}

      {userActiveTab === 'support' && <SupportCenter />}

      {userActiveTab === 'settings' && <SettingsPage />}

      {/* Persistent Global Modals */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={refreshAllData}
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
    </UserLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
