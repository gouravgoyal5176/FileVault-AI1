import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  HardDrive,
  Share2,
  ShieldAlert,
  Upload,
  Sliders,
  LogOut,
  LifeBuoy,
  Lock,
  ChevronUp,
  Mail,
  User as UserIcon,
  Key,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type UserNavTab = 'dashboard' | 'vault' | 'shared' | 'security' | 'threats' | 'support' | 'settings';

interface UserSidebarProps {
  activeTab: UserNavTab;
  setActiveTab: (tab: UserNavTab) => void;
  onOpenUpload: () => void;
}

export function UserSidebar({ activeTab, setActiveTab, onOpenUpload }: UserSidebarProps) {
  const { user, logout, logoutAll } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (profileCardRef.current && !profileCardRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  if (!user) return null;

  const formatDisplayName = () => {
    if ((user as any).name && (user as any).name.trim()) {
      return toTitleCase((user as any).name);
    }
    if ((user as any).fullName && (user as any).fullName.trim()) {
      return toTitleCase((user as any).fullName);
    }
    const rawLocal = user.email.split('@')[0];
    const cleaned = rawLocal.replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
    if (!cleaned) return 'Valued User';

    let parts = cleaned.split(/\s+/);
    if (parts.length === 1) {
      const single = parts[0].toLowerCase();
      if (single === 'gouravgoyal') {
        parts = ['gourav', 'goyal'];
      }
    }
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  const toTitleCase = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const fullName = formatDisplayName();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'My Vault', icon: HardDrive },
    { id: 'shared', label: 'Shared Files', icon: Share2 },
    { id: 'security', label: 'Security Center', icon: ShieldCheck },
    { id: 'threats', label: 'Threat Monitor', icon: ShieldAlert },
    { id: 'support', label: 'Support Center', icon: LifeBuoy },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <div className="w-64 bg-[#0B0F1E]/95 dark:bg-[#0B0F1E]/95 light:bg-white/95 backdrop-blur-xl flex flex-col justify-between h-full select-none text-slate-100 dark:text-slate-100 light:text-slate-900 relative">
      <div className="p-5 space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <ShieldCheck className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-indigo-400/20 rounded-xl blur-xs pointer-events-none" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-1.5 font-sans">
              FileVault <span className="text-[9px] bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold tracking-wider">AI 2.0</span>
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">Enterprise Security Vault</p>
          </div>
        </div>

        {/* Quick Upload CTA Button */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
        >
          <Upload className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
          <span>Upload File</span>
        </button>

        {/* Navigation Menu */}
        <nav className="space-y-1 relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-400 px-3 mb-2">Vault Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white dark:text-white light:text-indigo-600 font-bold'
                    : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeUserTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/20 dark:from-indigo-600/30 dark:to-purple-600/20 light:from-indigo-50 light:to-purple-50 border border-indigo-500/40 dark:border-indigo-500/40 light:border-indigo-200 rounded-xl shadow-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-indigo-400 dark:text-indigo-400 light:text-indigo-600 stroke-[2.5]' : 'text-slate-500 dark:text-slate-500 light:text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-400 light:bg-indigo-600 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile Card & Logout Actions */}
      <div className="p-4 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 bg-[#070A14] dark:bg-[#070A14] light:bg-slate-50 space-y-3 relative" ref={profileCardRef}>
        
        {/* Profile Card Trigger */}
        <div
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#101628] dark:bg-[#101628] light:bg-white hover:bg-[#161f38] dark:hover:bg-[#161f38] light:hover:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm cursor-pointer transition-all duration-150 group"
          title="Click to view complete profile details"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-white dark:text-white light:text-slate-900 truncate group-hover:text-indigo-400 dark:group-hover:text-indigo-300 light:group-hover:text-indigo-600 transition-colors">
              {user.email}
            </p>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> AES-256 Protected
            </span>
          </div>
          <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${profileOpen ? 'rotate-180 text-indigo-400' : ''}`} />
        </div>

        {/* Profile Details Popover */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute bottom-20 left-3 right-3 bg-[#0E1428] dark:bg-[#0E1428] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 text-slate-200 dark:text-slate-200 light:text-slate-800"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h4 className="font-extrabold text-xs text-white dark:text-white light:text-slate-900 truncate">
                      {fullName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 text-[9px] font-extrabold uppercase tracking-wider">
                        {user.role}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Active
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(false);
                  }}
                  className="text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 p-1 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Attributes */}
              <div className="space-y-2 text-xs">
                {/* Full Email Address */}
                <div className="p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-indigo-400" /> Registered Email
                  </span>
                  <a
                    href={`mailto:${user.email}`}
                    className="font-mono text-xs font-semibold text-indigo-300 dark:text-indigo-300 light:text-indigo-600 hover:underline break-all block"
                  >
                    {user.email}
                  </a>
                </div>

                {/* Account / User ID */}
                {user.id && (
                  <div className="p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                      <UserIcon className="w-3 h-3 text-indigo-400" /> Account User ID
                    </span>
                    <p className="font-mono text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 break-all">
                      {user.id}
                    </p>
                  </div>
                )}

                {/* Security Protection Status */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" /> Security Status
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> AES-256 Protected
                  </span>
                </div>

                {/* Auth Mode & Verification */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-purple-400" /> Auth Mode
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {user.authProvider || 'Zero-Trust Local JWT'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-200 transition font-medium text-[11px] cursor-pointer border border-transparent"
            title="Log out from current browser"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Logout</span>
          </button>

          <button
            onClick={logoutAll}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium text-[11px] cursor-pointer border border-transparent hover:border-rose-500/30"
            title="Revoke all device sessions"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Revoke All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
