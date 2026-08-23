import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Bell, CheckCircle2, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: 'security' | 'threats' | 'vault' | 'shared';
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'security' | 'threats' | 'vault' | 'shared') => void;
}

export function NotificationDropdown({ isOpen, onClose, onNavigateTab }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'INFO',
      title: 'Vault Envelope Integrity Verified',
      message: 'SHA-256 payload checksums verified for all active vault objects.',
      timestamp: '2 minutes ago',
      read: false,
      targetTab: 'security',
    },
    {
      id: '2',
      type: 'SUCCESS',
      title: 'AES-256-GCM Session Secure',
      message: 'Multi-factor authentication active. Zero key leaks detected.',
      timestamp: '15 minutes ago',
      read: false,
      targetTab: 'security',
    },
    {
      id: '3',
      type: 'WARNING',
      title: 'Behavioral Monitoring Active',
      message: '7-Vector anomaly model observing system access telemetry.',
      timestamp: '1 hour ago',
      targetTab: 'threats',
      read: true,
    },
    {
      id: '4',
      type: 'INFO',
      title: 'FileVault AI System Ready',
      message: 'Zero-Trust secure cloud vault operating cleanly.',
      timestamp: '2 hours ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.targetTab) {
      onNavigateTab(item.targetTab);
    }
    onClose();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0B0F1E]/95 dark:bg-[#0B0F1E]/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden text-slate-100 dark:text-slate-100 light:text-slate-900"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
            <h4 className="font-extrabold text-xs tracking-wide uppercase">Notifications</h4>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500 text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 transition cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
              <p className="text-xs font-bold">You're all caught up</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">No unread security notifications.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 transition cursor-pointer flex items-start gap-3 relative ${
                  !item.read
                    ? 'bg-indigo-500/5 border-l-2 border-indigo-500'
                    : 'opacity-80'
                }`}
              >
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-900 truncate">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Link */}
        <div className="p-3 bg-[#070A14] dark:bg-[#070A14] light:bg-slate-50 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 text-center">
          <button
            onClick={() => {
              onNavigateTab('security');
              onClose();
            }}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span>View Security Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
