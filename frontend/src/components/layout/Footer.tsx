import React from 'react';
import { Brain } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-indigo-500/10 bg-[#05070D] text-slate-400 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 dark:bg-[#05070D] light:bg-slate-100 light:border-slate-200">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Course Title */}
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white dark:text-white light:text-slate-900">
              Psychology Of Stress, Health And Well-Being
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 light:text-slate-600">
              NPTEL Student Learning & Practice Platform
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <button 
            onClick={() => onNavigate('home')} 
            className="hover:text-indigo-400 transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('weeks')} 
            className="hover:text-indigo-400 transition-colors"
          >
            Course Weeks
          </button>
          <button 
            onClick={() => onNavigate('practice')} 
            className="hover:text-indigo-400 transition-colors"
          >
            Practice Zone
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-center md:text-right max-w-sm">
          <p className="text-[11px] text-slate-500 leading-relaxed dark:text-slate-500 light:text-slate-600">
            This is an independent student learning project and is not an official NPTEL website.
          </p>
        </div>
      </div>
    </footer>
  );
};
