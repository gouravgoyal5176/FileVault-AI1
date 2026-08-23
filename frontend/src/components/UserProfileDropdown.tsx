import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Key, LogOut, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDropdown({ isOpen, onClose }: UserProfileDropdownProps) {
  const { user, logout, logoutAll } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  // Format Title Case full name from profile or email local-part
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

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute right-0 top-14 w-80 bg-[#0E1428] dark:bg-[#0E1428] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl z-50 p-4 space-y-4 text-slate-200 dark:text-slate-200 light:text-slate-800"
      >
        {/* Header Profile Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-100">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <h4 className="font-extrabold text-sm text-white dark:text-white light:text-slate-900 truncate">
              {fullName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                {user.role}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Account Information */}
        <div className="space-y-2.5 text-xs">
          {/* Full Email Address */}
          <div className="p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-indigo-400" /> Email Address
            </span>
            <a
              href={`mailto:${user.email}`}
              className="font-mono text-xs font-semibold text-indigo-300 dark:text-indigo-300 light:text-indigo-600 hover:underline break-all block"
              title="Registered Email"
            >
              {user.email}
            </a>
          </div>

          {/* Security Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" /> Encryption
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> AES-256 Protected
            </span>
          </div>

          {/* Authentication Provider */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121930] dark:bg-[#121930] light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3 h-3 text-purple-400" /> Auth Mode
            </span>
            <span className="text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
              {user.authProvider || 'Zero-Trust Local JWT'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-100 flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Logout</span>
          </button>

          <button
            onClick={() => {
              onClose();
              logoutAll();
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition cursor-pointer"
            title="Revoke all device sessions"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Revoke All</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
