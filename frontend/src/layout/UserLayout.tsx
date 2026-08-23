import React, { useState } from 'react';
import { UserSidebar, UserNavTab } from './UserSidebar';
import { UserNavbar } from './UserNavbar';
import { MobileBottomNav } from './MobileBottomNav';
import { AppFooter } from '../components/AppFooter';
import { Menu, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserLayoutProps {
  activeTab: UserNavTab;
  setActiveTab: (tab: UserNavTab) => void;
  onOpenUpload: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  children: React.ReactNode;
}

export function UserLayout({
  activeTab,
  setActiveTab,
  onOpenUpload,
  searchQuery,
  setSearchQuery,
  children,
}: UserLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#070913] dark:bg-[#070913] light:bg-[#F8FAFC] font-sans text-slate-100 dark:text-slate-100 light:text-slate-900 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Ambient Radial Mesh & Glowing Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/10 light:bg-indigo-400/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-600/5 dark:bg-purple-600/5 light:bg-purple-400/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 dark:bg-blue-600/5 light:bg-blue-400/5 rounded-full blur-[180px]" />
        {/* Subtle Cyber Grid Overlay Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] light:opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col h-full w-64 shrink-0 z-30 overflow-y-auto border-r border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenUpload={onOpenUpload} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white h-full shadow-2xl border-r border-slate-800 dark:border-slate-800 light:border-slate-200 z-10"
            >
              <UserSidebar
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Independently Scrollable Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 z-10 relative overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden p-3.5 bg-[#0B0F1E]/90 dark:bg-[#0B0F1E]/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white dark:text-white light:text-slate-900 tracking-tight">FileVault AI</span>
          </div>
        </div>

        <UserNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenUpload={onOpenUpload}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {activeTab === 'dashboard' && <AppFooter />}
        </main>
      </div>

      {/* App-Style Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
