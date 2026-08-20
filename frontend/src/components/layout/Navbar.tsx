import React, { useState } from 'react';
import { Brain, BookOpen, Target, Bookmark, Sun, Moon, Menu, X, Sparkles } from 'lucide-react';
import { ThemeMode } from '../../types/quiz';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  bookmarkCount: number;
  availableWeeksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  bookmarkCount,
  availableWeeksCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: Brain },
    { id: 'weeks', label: 'Weeks', icon: BookOpen, count: availableWeeksCount },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark, count: bookmarkCount },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-500/10 bg-[#070A12]/80 backdrop-blur-xl transition-colors duration-300 dark:bg-[#070A12]/80 light:bg-white/80 light:border-slate-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex cursor-pointer items-center space-x-3 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Brain className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                Mind<span className="text-indigo-400">Prep</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                NPTEL
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 hidden xs:block">
              Psychology Of Stress, Health And Well-Being
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id || (currentView.startsWith('week-') && link.id === 'weeks');
            
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-indigo-500/15 border border-indigo-500/30 dark:text-white light:text-indigo-600 light:bg-indigo-50 light:border-indigo-200'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 dark:text-slate-300 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                
                {typeof link.count === 'number' && link.count > 0 && (
                  <span className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-800 text-slate-300 dark:bg-slate-800 light:bg-slate-200 light:text-slate-700'
                  }`}>
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Theme Toggle & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3">
          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-200 dark:text-slate-300 light:border-slate-300 light:bg-slate-100 light:text-slate-700"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-slate-300 hover:text-white transition-all duration-200 dark:text-slate-300 light:border-slate-300 light:bg-slate-100 light:text-slate-700"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-indigo-400" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-indigo-500/20 bg-[#0A0E1A]/95 backdrop-blur-2xl px-4 pt-2 pb-5 space-y-2 dark:bg-[#0A0E1A]/95 light:bg-white/95">
          <div className="py-2 border-b border-white/5 mb-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> NPTEL Course Navigator
            </span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id || (currentView.startsWith('week-') && link.id === 'weeks');

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-white border border-indigo-500/40 dark:text-white light:bg-indigo-50 light:text-indigo-600 light:border-indigo-200'
                    : 'text-slate-300 hover:bg-white/5 dark:text-slate-300 light:text-slate-700 light:hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>

                {typeof link.count === 'number' && link.count > 0 && (
                  <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-300">
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
