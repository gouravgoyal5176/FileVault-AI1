import React from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  ArrowRight,
  Mail,
  AlertTriangle,
  Layers,
  HardDrive,
  Database,
  Cpu,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Globe,
  Share2,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface FileVaultLandingProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onAdminClick: () => void;
}

export const FileVaultLanding: React.FC<FileVaultLandingProps> = ({
  onLoginClick,
  onRegisterClick,
  onAdminClick
}) => {
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] dark:bg-[#030712] light:bg-[#F8FAFC] text-white dark:text-white light:text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* Top Background Gradient Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent dark:from-indigo-600/20 light:from-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] light:bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#030712]/80 dark:bg-[#030712]/80 light:bg-white/90 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 border border-indigo-400/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-1.5">
                FileVault <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="block text-[10px] font-mono text-indigo-400/80 dark:text-indigo-400/80 light:text-indigo-600 uppercase tracking-widest -mt-1">
                Zero-Trust Security
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-600">
            <button onClick={() => scrollToSection('about')} className="hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer">About</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer">How It Works</button>
            <button onClick={() => scrollToSection('architecture')} className="hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer">Architecture</button>
            <button onClick={() => scrollToSection('security')} className="hover:text-indigo-400 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition cursor-pointer">Security</button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:px-3 sm:py-2 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                  <span className="text-xs font-semibold hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
                  <span className="text-xs font-semibold hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={onLoginClick}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onRegisterClick}
              className="px-4 sm:px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              Create Vault
            </button>
            <button
              onClick={onAdminClick}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-400 dark:text-cyan-400 light:text-cyan-700 bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-50 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/20 light:hover:bg-cyan-100 border border-cyan-500/30 dark:border-cyan-500/30 light:border-cyan-300 rounded-xl transition cursor-pointer"
              title="Open System Administrator Console"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-24 lg:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs font-bold tracking-wider uppercase shadow-inner">
              <Sparkles className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
              <span>Zero-Trust Enterprise Digital File Vault</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900 leading-[1.12]">
              Your Files.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 light:from-indigo-600 light:via-purple-600 light:to-cyan-600 bg-clip-text text-transparent">
                Encrypted. Protected. Yours.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed max-w-2xl">
              FileVault AI combines client-envelope AES-256-GCM encryption, Gmail OTP &amp; MFA authentication, and MinIO S3 object storage to keep your files secure, verifiable, and private.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onRegisterClick}
                className="flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl shadow-xl shadow-indigo-600/30 border border-indigo-400/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('architecture')}
                className="flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-slate-100 hover:bg-[#121827] dark:hover:bg-[#121827] light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-2xl transition duration-200 hover:border-slate-600 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 dark:text-cyan-400 light:text-cyan-600" />
                <span>Explore Security</span>
              </button>
            </div>

            {/* Micro Metrics Banner */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
              <div>
                <p className="text-2xl font-black text-white dark:text-white light:text-slate-900 font-mono">AES-256</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">GCM Envelope Cipher</p>
              </div>
              <div>
                <p className="text-2xl font-black text-cyan-400 dark:text-cyan-400 light:text-cyan-600 font-mono">100%</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Real Gmail Delivery</p>
              </div>
              <div>
                <p className="text-2xl font-black text-purple-400 dark:text-purple-400 light:text-purple-600 font-mono">MinIO</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">S3 Object Storage</p>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Graphic Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md bg-[#0D1224]/90 dark:bg-[#0D1224]/90 light:bg-white backdrop-blur-2xl border border-indigo-500/30 dark:border-indigo-500/30 light:border-slate-200 rounded-3xl p-6 shadow-2xl dark:shadow-indigo-500/10 light:shadow-xl space-y-6">
              
              {/* Graphic Header */}
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-600">filevault-node-master</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                  ENCRYPTION ACTIVE
                </span>
              </div>

              {/* Graphic Central Digital Vault Visual */}
              <div className="relative py-8 bg-[#050814] dark:bg-[#050814] light:bg-slate-50 rounded-2xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                
                {/* Glowing Vault Icon */}
                <div className="relative p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-2xl shadow-indigo-500/40 border border-indigo-400/40 animate-pulse">
                  <Lock className="w-10 h-10 text-white" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">Cryptographic Vault Engine</p>
                  <p className="text-xs font-mono text-cyan-300 dark:text-cyan-300 light:text-indigo-600">DEK: Wrapped master key via PBKDF2</p>
                </div>

                {/* Pipeline Badges */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300">Auth Tag</span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300">IV Vector</span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300">SHA-256</span>
                </div>
              </div>

              {/* Realtime Security Status Cards */}
              <div className="space-y-2.5">
                <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-400 light:text-emerald-600" />
                    <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Database Integrity</span>
                  </div>
                  <span className="font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-bold">PostgreSQL OK</span>
                </div>

                <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
                    <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">SMTP Gmail Delivery</span>
                  </div>
                  <span className="font-mono text-indigo-400 dark:text-indigo-400 light:text-indigo-700 font-bold">Gmail Active</span>
                </div>

                <div className="p-3 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-purple-400 dark:text-purple-400 light:text-purple-600" />
                    <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Encrypted Storage</span>
                  </div>
                  <span className="font-mono text-purple-400 dark:text-purple-400 light:text-purple-700 font-bold">MinIO S3</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 2: WHY FILEVAULT AI (PROBLEM vs SOLUTION) */}
      <section id="about" className="py-20 bg-[#050814] dark:bg-[#050814] light:bg-slate-100/70 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 dark:text-indigo-400 light:text-indigo-600">
              Why FileVault AI?
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              Traditional Cloud Storage vs Zero-Trust Vault
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Most standard cloud storage providers store your files unencrypted or hold the decryption keys themselves. FileVault AI puts privacy and cryptographic verification in your hands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Cloud Storage Risks */}
            <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 rounded-3xl p-8 space-y-6 shadow-md light:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 dark:bg-rose-500/10 light:bg-rose-50 rounded-2xl border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 text-rose-400 dark:text-rose-400 light:text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">Traditional Storage Risks</h3>
                  <p className="text-xs text-rose-400 dark:text-rose-400 light:text-rose-600 font-semibold">Vulnerable to Data Breaches &amp; Provider Access</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>Files stored in plaintext or server-side encrypted where provider holds keys.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>No independent cryptographic proof that stored files haven't been modified or tampered with.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>Lack of multi-factor authentication leaving credentials open to password stuffing attacks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>Unrestricted file sharing links without granular view vs download authorization.</span>
                </li>
              </ul>
            </div>

            {/* FileVault AI Zero-Trust Solution */}
            <div className="bg-[#0B0F1A] dark:bg-[#0B0F1A] light:bg-white border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-md light:shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 rounded-2xl border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">FileVault AI Solution</h3>
                  <p className="text-xs text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-semibold">Client Envelope Encryption &amp; Audit</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>AES-256-GCM Envelope Encryption</strong>: Each file is encrypted with a unique Data Encryption Key.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Gmail OTP &amp; MFA Auth</strong>: Real email verification delivered directly to Gmail.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Deception Honeyfile Trap</strong>: Active intrusion prevention and rate-limited anomaly detection.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Granular File Sharing</strong>: Expiration limits, VIEW vs DOWNLOAD controls, and immediate access revocation.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: CORE FEATURES GRID */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
              Enterprise Features
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              Designed for Maximum Security &amp; Control
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Explore the core cryptographic and authentication features built into FileVault AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-indigo-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">AES-256-GCM Envelope Encryption</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Files are encrypted with unique DEKs wrapped by master key credentials. GCM authentication tags prevent tampering.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-purple-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 border border-purple-500/20 dark:border-purple-500/20 light:border-purple-200 text-purple-400 dark:text-purple-400 light:text-purple-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">Gmail OTP &amp; MFA Protection</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Registration codes and login multi-factor authorization tokens are delivered via real Gmail SMTP.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-cyan-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/10 light:bg-cyan-50 border border-cyan-500/20 dark:border-cyan-500/20 light:border-cyan-200 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">Honeyfile Trap &amp; Anomaly Detector</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Decoy honeyfiles trigger security alerts when unauthorized users attempt downloads.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">Controlled File Sharing</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Share files with specific users, assign VIEW or DOWNLOAD permissions, set expiration dates, and revoke instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-amber-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50 border border-amber-500/20 dark:border-amber-500/20 light:border-amber-200 text-amber-400 dark:text-amber-400 light:text-amber-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">Real-Time Audit Trail</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Every login, file upload, download stream, and share request is logged in PostgreSQL with client IP and User-Agent meta.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-indigo-500/40 transition group shadow-md light:shadow-sm">
              <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">MinIO S3 Object Storage</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                High-performance object storage keeps encrypted payloads separate from metadata for modular security.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS (4-STEP WORKFLOW) */}
      <section id="how-it-works" className="py-20 bg-[#050814] dark:bg-[#050814] light:bg-slate-100/70 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 dark:text-indigo-400 light:text-indigo-600">
              Workflow Guide
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              How FileVault AI Operates
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Four simple steps ensure end-to-end cryptographic protection from upload to sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 relative shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">Register &amp; MFA</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Create an account and verify your email address via real Gmail 6-digit OTP code.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 relative shadow-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">Envelope Encryption</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Files are encrypted with unique AES-256 DEKs before being stored in MinIO.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 relative shadow-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-black text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">Secure Metadata</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                File hashes and envelope metadata are cataloged in PostgreSQL while Redis manages rate limits.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 relative shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                4
              </div>
              <h3 className="text-sm font-extrabold text-white dark:text-white light:text-slate-900">Controlled Share</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                Share files with other users with VIEW/DOWNLOAD permissions and instant email alerts.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: SYSTEM ARCHITECTURE SHOWCASE */}
      <section id="architecture" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
              System Topology
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              Multi-Layer Security Architecture
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Inspecting the microservice layers running locally inside Docker Compose.
            </p>
          </div>

          <div className="bg-[#0D1224]/90 dark:bg-[#0D1224]/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-2xl dark:shadow-2xl light:shadow-md space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              
              <div className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 rounded-2xl space-y-2">
                <Globe className="w-6 h-6 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 mx-auto" />
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">Client Layer</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">React 18 + Vite (Port 6100)</p>
              </div>

              <div className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-purple-500/30 dark:border-purple-500/30 light:border-purple-200 rounded-2xl space-y-2">
                <Cpu className="w-6 h-6 text-purple-400 dark:text-purple-400 light:text-purple-600 mx-auto" />
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">API Layer</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">Node.js Express (Port 5000)</p>
              </div>

              <div className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-cyan-500/30 dark:border-cyan-500/30 light:border-cyan-200 rounded-2xl space-y-2">
                <Lock className="w-6 h-6 text-cyan-400 dark:text-cyan-400 light:text-cyan-600 mx-auto" />
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">Security Engine</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">AES-256-GCM Envelope</p>
              </div>

              <div className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-200 rounded-2xl space-y-2">
                <Database className="w-6 h-6 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">Data Layer</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">PostgreSQL + Redis + MinIO</p>
              </div>

              <div className="p-4 bg-[#121827] dark:bg-[#121827] light:bg-slate-50 border border-amber-500/30 dark:border-amber-500/30 light:border-amber-200 rounded-2xl space-y-2">
                <Mail className="w-6 h-6 text-amber-400 dark:text-amber-400 light:text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">SMTP Layer</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono">Gmail SSL (Port 465)</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section id="security" className="py-20 bg-gradient-to-b from-[#050814] to-[#030712] dark:from-[#050814] dark:to-[#030712] light:from-slate-100 light:to-white border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/10 light:bg-indigo-50 rounded-full border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 w-fit mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight max-w-2xl mx-auto">
            Ready to secure your files with enterprise-grade zero-trust storage?
          </h2>

          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm max-w-xl mx-auto">
            Create an account in seconds to test real Gmail verification, file encryption, and secure sharing.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onRegisterClick}
              className="px-8 py-4 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl shadow-xl shadow-indigo-600/30 border border-indigo-400/40 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              Create Vault Account
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-4 text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-2xl transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#030712] dark:bg-[#030712] light:bg-white border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 py-12 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
                <Shield className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" />
              </div>
              <div>
                <span className="font-extrabold text-white dark:text-white light:text-slate-900 text-base">FileVault AI</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-400">Enterprise Cybersecurity Vault</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">
              <button onClick={() => scrollToSection('about')} className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition">About</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition">Features</button>
              <button onClick={() => scrollToSection('architecture')} className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition">Architecture</button>
              <button onClick={onLoginClick} className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition">Login</button>
              <button onClick={onRegisterClick} className="hover:text-white dark:hover:text-white light:hover:text-slate-900 transition">Register</button>
              <button onClick={onAdminClick} className="hover:text-cyan-400 dark:hover:text-cyan-400 light:hover:text-cyan-600 transition text-cyan-400 dark:text-cyan-400 light:text-cyan-600 font-semibold">Admin</button>
            </div>

          </div>

          <div className="border-t border-slate-900 dark:border-slate-900 light:border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-500">
            <p>© 2026 FileVault AI. Secure by Design • Built with Security in Mind.</p>
            <p className="font-medium text-slate-400 dark:text-slate-400 light:text-slate-600">
              Designed &amp; Built by <span className="text-indigo-300 dark:text-indigo-300 light:text-indigo-600 font-bold">Gourav Goyal</span> • <span className="text-purple-300 dark:text-purple-300 light:text-purple-600 font-bold">Saurabh Singh Rawat</span> • <span className="text-cyan-300 dark:text-cyan-300 light:text-cyan-600 font-bold">Bhaskar Raj Singh Thakur</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
