import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { apiRequest } from './api/apiClient';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { StorageCard } from './components/dashboard/StorageCard';
import { SecurityScoreCard } from './components/dashboard/SecurityScoreCard';
import { ThreatLevelCard } from './components/dashboard/ThreatLevelCard';
import { QuickActions } from './components/dashboard/QuickActions';
import { ActivityTimeline } from './components/dashboard/ActivityTimeline';
import { SecurityStatusWidget } from './components/widgets/SecurityStatusWidget';
import { FileList, FileItem } from './components/FileList';
import { SharedWithMe } from './components/SharedWithMe';
import { SecurityCenter } from './components/SecurityCenter';
import { ThreatAlertsWidget } from './components/ThreatAlertsWidget';
import { AnomalyMonitorWidget } from './components/AnomalyMonitorWidget';
import { FileUploadModal } from './components/FileUploadModal';
import { FileDetailsModal } from './components/FileDetailsModal';
import { ShareFileModal } from './components/ShareFileModal';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { SettingsPage } from './components/pages/SettingsPage';
import { NavTab } from './layout/Sidebar';

export function App() {
  const { user, loading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);

  const [threatSummary, setThreatSummary] = useState<any>(null);
  const [threatLoading, setThreatLoading] = useState<boolean>(true);

  const [scoreData, setScoreData] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState<boolean>(true);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
  const [selectedShareFile, setSelectedShareFile] = useState<FileItem | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    setFilesLoading(true);
    try {
      const data = await apiRequest<{ files: FileItem[] }>('/api/files');
      setFiles(data.files);
    } catch (err) {
      // Ignore
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchThreatSummary = async () => {
    if (!user) return;
    setThreatLoading(true);
    try {
      const data = await apiRequest<any>('/api/threats/summary');
      setThreatSummary(data);
    } catch (err) {
      // Ignore
    } finally {
      setThreatLoading(false);
    }
  };

  const fetchScore = async () => {
    if (!user) return;
    setScoreLoading(true);
    try {
      const data = await apiRequest<any>('/api/security-center/score');
      setScoreData(data);
    } catch (err) {
      // Ignore
    } finally {
      setScoreLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    if (!user) return;
    setLogsLoading(true);
    try {
      const data = await apiRequest<{ logs: any[] }>('/api/security-center/audit-logs?limit=5');
      setRecentLogs(data.logs);
    } catch (err) {
      // Ignore
    } finally {
      setLogsLoading(false);
    }
  };

  const refreshAllData = () => {
    fetchFiles();
    fetchThreatSummary();
    fetchScore();
    fetchRecentLogs();
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to permanently delete this encrypted file?')) return;
    try {
      await apiRequest(`/api/files/${fileId}`, { method: 'DELETE' });
      refreshAllData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const totalVaultBytes = files.reduce((acc, f) => acc + f.size, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-400 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Verifying encrypted session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenUpload={() => setIsUploadOpen(true)}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <HeroBanner
            onOpenUpload={() => setIsUploadOpen(true)}
            onNavigateSecurity={() => setActiveTab('security')}
          />

          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StorageCard totalBytes={totalVaultBytes} fileCount={files.length} />
            <SecurityScoreCard
              score={scoreData}
              loading={scoreLoading}
              onRefresh={fetchScore}
              onNavigateSecurity={() => setActiveTab('security')}
            />
            <ThreatLevelCard
              summary={threatSummary}
              loading={threatLoading}
              onRefresh={fetchThreatSummary}
              onNavigateThreats={() => setActiveTab('threats')}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions
            onOpenUpload={() => setIsUploadOpen(true)}
            onRefresh={refreshAllData}
            onNavigateSecurity={() => setActiveTab('security')}
          />

          {/* AI Behaviour Anomaly Engine */}
          <AnomalyMonitorWidget />

          {/* Files Preview & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Recent Encrypted Files</h3>
                <button
                  onClick={() => setActiveTab('vault')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  View All Files →
                </button>
              </div>
              <FileList
                files={files.slice(0, 5)}
                loading={filesLoading}
                onRefresh={refreshAllData}
                onSelectDetails={(id) => setSelectedDetailsId(id)}
                onSelectShare={(f) => setSelectedShareFile(f)}
                onDelete={handleDeleteFile}
                externalSearch={searchQuery}
              />
            </div>

            <div>
              <ActivityTimeline logs={recentLogs} loading={logsLoading} />
            </div>
          </div>

          {/* Security Status Widget */}
          <SecurityStatusWidget />
        </div>
      )}

      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">Encrypted Files Vault</h2>
          </div>
          <FileList
            files={files}
            loading={filesLoading}
            onRefresh={refreshAllData}
            onSelectDetails={(id) => setSelectedDetailsId(id)}
            onSelectShare={(f) => setSelectedShareFile(f)}
            onDelete={handleDeleteFile}
            externalSearch={searchQuery}
          />
        </div>
      )}

      {activeTab === 'shared' && (
        <SharedWithMe onSelectDetails={(id) => setSelectedDetailsId(id)} />
      )}

      {activeTab === 'security' && <SecurityCenter />}

      {activeTab === 'threats' && (
        <div className="space-y-6">
          <ThreatAlertsWidget />
          <AnomalyMonitorWidget />
        </div>
      )}

      {activeTab === 'admin' && user.role === 'ADMIN' && <AdminDashboard />}

      {activeTab === 'settings' && <SettingsPage />}

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={refreshAllData}
      />

      <FileDetailsModal
        fileId={selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
      />

      <ShareFileModal
        fileId={selectedShareFile?.id || null}
        filename={selectedShareFile?.originalFilename || ''}
        onClose={() => setSelectedShareFile(null)}
      />
    </DashboardLayout>
  );
}

export default App;
