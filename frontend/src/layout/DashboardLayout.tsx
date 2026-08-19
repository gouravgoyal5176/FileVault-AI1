import { useState, ReactNode } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenUpload: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  onOpenUpload,
  searchQuery,
  setSearchQuery,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenUpload={onOpenUpload} />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full shadow-2xl">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              onOpenUpload={() => {
                onOpenUpload();
                setMobileSidebarOpen(false);
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Persistent Global Footer Required by User */}
        <footer className="border-t border-slate-200/80 bg-white px-6 py-4 text-center text-xs text-slate-500 font-medium select-none">
          Made by Gourav Goyal, Saurabh Singh Rawat &amp; Bhaskar Raj Singh Thakur
        </footer>
      </div>
    </div>
  );
}
