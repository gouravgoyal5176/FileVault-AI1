import React, { useState } from 'react';
import { AdminSidebar, AdminNavSection } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
  activeSection: AdminNavSection;
  setActiveSection: (section: AdminNavSection) => void;
  adminSearchQuery: string;
  setAdminSearchQuery: (query: string) => void;
  children: React.ReactNode;
}

export function AdminLayout({
  activeSection,
  setActiveSection,
  adminSearchQuery,
  setAdminSearchQuery,
  children,
}: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#05070E] font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop Admin Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-xs flex">
          <div className="w-64 bg-[#0B0F1A] h-full shadow-2xl">
            <AdminSidebar
              activeSection={activeSection}
              setActiveSection={(section) => {
                setActiveSection(section);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Admin Console Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden p-3 bg-[#0B0F1A] border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm text-white tracking-wide">FileVault ADMIN</span>
        </div>

        <AdminNavbar searchQuery={adminSearchQuery} setSearchQuery={setAdminSearchQuery} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 bg-[#070A12] px-6 py-4 text-center text-xs text-slate-500 font-mono select-none">
          FileVault AI — Admin Security Console v2.0
        </footer>
      </div>
    </div>
  );
}
