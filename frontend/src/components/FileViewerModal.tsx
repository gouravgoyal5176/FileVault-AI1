import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccessToken } from '../api/apiClient';
import {
  X,
  FileText,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Download,
  RefreshCw,
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  Music,
  Video
} from 'lucide-react';

interface FileViewerModalProps {
  isOpen: boolean;
  fileId: string | null;
  filename: string;
  mimeType: string;
  permission: 'VIEW' | 'DOWNLOAD';
  viewerEmail?: string;
  onClose: () => void;
}

export function FileViewerModal({
  isOpen,
  fileId,
  filename,
  mimeType,
  permission,
  viewerEmail,
  onClose,
}: FileViewerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const isViewOnly = permission === 'VIEW';

  // Strict Window & Document Capture-Phase Security Listeners for VIEW Mode
  // NOTE: Wheel, touch, and scroll events are NEVER intercepted so full vertical scrolling is preserved.
  useEffect(() => {
    if (!isOpen || !isViewOnly) return;

    // 1. Focus modal container
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // 2. Lock text selection styling across document body
    const prevUserSelect = document.body.style.userSelect;
    const prevWebkitUserSelect = (document.body.style as any).webkitUserSelect;
    const prevMozUserSelect = (document.body.style as any).mozUserSelect;
    const prevMsUserSelect = (document.body.style as any).msUserSelect;

    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';

    // 3. Selection Wiping Listener — instantly clears any highlighted text range
    const clearSelection = () => {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          sel.removeAllRanges();
        }
      } catch (err) {
        // Suppress errors
      }
    };

    // 4. Robust Keyboard Shortcut Interception (Blocking Copy/Cut/Paste/Save/Print/ViewSource/DevTools)
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = (e.key || '').toUpperCase();
      const code = (e.code || '').toUpperCase();
      const keyCode = e.keyCode || e.which;

      // Match Copy: Ctrl+C / Cmd+C (67)
      const isCopy = isCtrlOrCmd && (key === 'C' || code === 'KEYC' || keyCode === 67);
      // Match Cut: Ctrl+X / Cmd+X (88)
      const isCut = isCtrlOrCmd && (key === 'X' || code === 'KEYX' || keyCode === 88);
      // Match Paste: Ctrl+V / Cmd+V (86)
      const isPaste = isCtrlOrCmd && (key === 'V' || code === 'KEYV' || keyCode === 86);
      // Match Select All: Ctrl+A / Cmd+A (65)
      const isSelectAll = isCtrlOrCmd && (key === 'A' || code === 'KEYA' || keyCode === 65);
      // Match Print: Ctrl+P / Cmd+P (80)
      const isPrint = isCtrlOrCmd && (key === 'P' || code === 'KEYP' || keyCode === 80);
      // Match Save: Ctrl+S / Cmd+S (83)
      const isSave = isCtrlOrCmd && (key === 'S' || code === 'KEYS' || keyCode === 83);
      // Match View Source: Ctrl+U / Cmd+U (85)
      const isViewSource = isCtrlOrCmd && (key === 'U' || code === 'KEYU' || keyCode === 85);
      // Match DevTools: F12 (123), Ctrl+Shift+I (73), Ctrl+Shift+C (67), Ctrl+Shift+J (74)
      const isDevTools =
        keyCode === 123 ||
        key === 'F12' ||
        code === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && (key === 'I' || key === 'C' || key === 'J' || code === 'KEYI' || code === 'KEYC' || code === 'KEYJ' || keyCode === 73 || keyCode === 67 || keyCode === 74));

      if (isCopy || isCut || isPaste || isSelectAll || isPrint || isSave || isViewSource || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        clearSelection();

        if (isCopy || isCut) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(() => {});
          }
        }
        return false;
      }

      // Match PrintScreen
      if (key === 'PRINTSCREEN' || code.includes('PRINTSCREEN') || keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        return false;
      }
    };

    // 5. Capture Phase Clipboard & Pointer Event Handlers
    const handleCopyCapture = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (e.clipboardData) e.clipboardData.setData('text/plain', '');
      clearSelection();
    };

    const handleCutCapture = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      clearSelection();
    };

    const handlePasteCapture = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    };

    const handleContextMenuCapture = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    };

    const handleSelectStartCapture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      clearSelection();
    };

    const handleDragStartCapture = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    };

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    };

    // Register capture phase listeners with { capture: true, passive: false }
    // NO wheel, mousewheel, touch, or scroll listeners are added here so scrolling is completely unblocked.
    const targets = [window, document, document.documentElement, document.body];
    const listenerOptions = { capture: true, passive: false };

    targets.forEach((target) => {
      target.addEventListener('keydown', handleKeyDownCapture as any, listenerOptions);
      target.addEventListener('keyup', handleKeyDownCapture as any, listenerOptions);
      target.addEventListener('keypress', handleKeyDownCapture as any, listenerOptions);
      target.addEventListener('copy', handleCopyCapture as any, listenerOptions);
      target.addEventListener('cut', handleCutCapture as any, listenerOptions);
      target.addEventListener('paste', handlePasteCapture as any, listenerOptions);
      target.addEventListener('contextmenu', handleContextMenuCapture as any, listenerOptions);
      target.addEventListener('selectstart', handleSelectStartCapture as any, listenerOptions);
      target.addEventListener('selectionchange', clearSelection as any, listenerOptions);
      target.addEventListener('dragstart', handleDragStartCapture as any, listenerOptions);
      target.addEventListener('beforeprint', handleBeforePrint as any, listenerOptions);
    });

    return () => {
      // Restore body selection styling
      document.body.style.userSelect = prevUserSelect;
      (document.body.style as any).webkitUserSelect = prevWebkitUserSelect;
      (document.body.style as any).mozUserSelect = prevMozUserSelect;
      (document.body.style as any).msUserSelect = prevMsUserSelect;

      // Clean up capture phase listeners
      targets.forEach((target) => {
        target.removeEventListener('keydown', handleKeyDownCapture as any, listenerOptions);
        target.removeEventListener('keyup', handleKeyDownCapture as any, listenerOptions);
        target.removeEventListener('keypress', handleKeyDownCapture as any, listenerOptions);
        target.removeEventListener('copy', handleCopyCapture as any, listenerOptions);
        target.removeEventListener('cut', handleCutCapture as any, listenerOptions);
        target.removeEventListener('paste', handlePasteCapture as any, listenerOptions);
        target.removeEventListener('contextmenu', handleContextMenuCapture as any, listenerOptions);
        target.removeEventListener('selectstart', handleSelectStartCapture as any, listenerOptions);
        target.removeEventListener('selectionchange', clearSelection as any, listenerOptions);
        target.removeEventListener('dragstart', handleDragStartCapture as any, listenerOptions);
        target.removeEventListener('beforeprint', handleBeforePrint as any, listenerOptions);
      });
    };
  }, [isOpen, isViewOnly]);

  useEffect(() => {
    if (!isOpen || !fileId) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setTextContent(null);
      setError(null);
      setLoading(true);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setTextContent(null);

    async function loadFileContent() {
      try {
        const token = getAccessToken();
        const response = await fetch(`/api/files/${fileId}/view`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to view file (HTTP ${response.status})`);
        }

        const blob = await response.blob();
        if (!isMounted) return;

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        const lowerMime = (mimeType || '').toLowerCase();
        const lowerName = (filename || '').toLowerCase();

        const isText =
          lowerMime.startsWith('text/') ||
          lowerMime.includes('json') ||
          lowerMime.includes('javascript') ||
          lowerMime.includes('xml') ||
          lowerName.endsWith('.txt') ||
          lowerName.endsWith('.json') ||
          lowerName.endsWith('.md') ||
          lowerName.endsWith('.js') ||
          lowerName.endsWith('.ts') ||
          lowerName.endsWith('.py') ||
          lowerName.endsWith('.css') ||
          lowerName.endsWith('.html') ||
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.log');

        if (isText) {
          const text = await blob.text();
          if (isMounted) setTextContent(text);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error decrypting file for view');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFileContent();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, fileId]);

  if (!isOpen || !fileId) return null;

  const handleDownload = async () => {
    if (permission !== 'DOWNLOAD') return;
    setDownloading(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();

  const isImage = lowerMime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lowerName);
  const isPdf = lowerMime.includes('pdf') || lowerName.endsWith('.pdf');
  const isVideo = lowerMime.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(lowerName);
  const isAudio = lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(lowerName);
  const isText = textContent !== null;

  return (
    <AnimatePresence>
      <div
        tabIndex={-1}
        ref={modalRef}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans select-none overflow-hidden outline-none"
        onContextMenu={(e) => {
          if (isViewOnly) e.preventDefault();
        }}
        onCopy={(e) => {
          if (isViewOnly) {
            e.preventDefault();
            if (e.clipboardData) e.clipboardData.setData('text/plain', '');
          }
        }}
        onCut={(e) => {
          if (isViewOnly) e.preventDefault();
        }}
        onPaste={(e) => {
          if (isViewOnly) e.preventDefault();
        }}
        onDragStart={(e) => {
          if (isViewOnly) e.preventDefault();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[#0B0F1A]/95 border border-indigo-500/30 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl shadow-indigo-950/80 overflow-hidden relative"
        >
          {/* Top Header */}
          <div className="bg-[#0D1224] border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
                {isImage && <ImageIcon className="w-5 h-5 text-cyan-400" />}
                {isPdf && <FileText className="w-5 h-5 text-rose-400" />}
                {isVideo && <Video className="w-5 h-5 text-amber-400" />}
                {isAudio && <Music className="w-5 h-5 text-emerald-400" />}
                {isText && <FileCode className="w-5 h-5 text-purple-400" />}
                {!isImage && !isPdf && !isVideo && !isAudio && !isText && (
                  <FileText className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-white text-base truncate tracking-tight flex items-center gap-2">
                  {filename}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono">{mimeType || 'application/octet-stream'}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" /> AES-256 DECRYPTED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {permission === 'DOWNLOAD' ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading || loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Download decrypted file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading ? 'Downloading...' : 'Download'}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-extrabold text-xs tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> VIEW ONLY — DOWNLOAD PROHIBITED
                </span>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Viewer Body Container */}
          <div className="flex-1 bg-[#05070E] p-4 sm:p-6 overflow-hidden flex flex-col relative select-none">
            {/* Dynamic Security Watermark Overlay for VIEW Mode (pointer-events-none guarantees 100% unblocked scrolling) */}
            {isViewOnly && !loading && !error && (
              <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden flex flex-wrap justify-around items-center opacity-15 p-4 space-x-12 space-y-12">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="rotate-[-25deg] text-center text-slate-300 font-mono text-xs sm:text-sm font-extrabold tracking-widest uppercase">
                    <div>VIEW ONLY • FILEVAULT AI</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Shared with: {viewerEmail || 'Authorized Viewer'}</div>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="font-mono text-xs tracking-wider text-indigo-300">
                  DECRYPTING AES-256 ENVELOPE STREAM...
                </span>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-md p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl space-y-3 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                  <h4 className="font-extrabold text-base text-rose-200">Unable to Display File</h4>
                  <p className="text-xs text-rose-300/90">{error}</p>
                </div>
              </div>
            ) : isImage && blobUrl ? (
              <div className="w-full flex-1 flex items-center justify-center overflow-y-auto overflow-x-hidden select-none">
                <img
                  src={blobUrl}
                  alt={filename}
                  onDragStart={(e) => e.preventDefault()}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800 select-none pointer-events-none"
                />
              </div>
            ) : isPdf && blobUrl ? (
              <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none relative">
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0`}
                  title={filename}
                  className="w-full h-full rounded-2xl border-0"
                  onLoad={(e) => {
                    if (!isViewOnly) return;
                    try {
                      const win = e.currentTarget.contentWindow;
                      if (win) {
                        const block = (ev: Event) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                        };
                        win.addEventListener('contextmenu', block, true);
                        win.addEventListener('copy', block, true);
                        win.addEventListener('cut', block, true);
                        win.addEventListener('keydown', block, true);
                      }
                    } catch (err) {
                      // Same-origin blob iframe
                    }
                  }}
                />
              </div>
            ) : isVideo && blobUrl ? (
              <div className="w-full flex-1 flex items-center justify-center">
                <video
                  src={blobUrl}
                  controls
                  controlsList={isViewOnly ? 'nodownload' : undefined}
                  onDragStart={(e) => e.preventDefault()}
                  className="max-h-[72vh] max-w-full rounded-2xl border border-slate-800 shadow-2xl"
                />
              </div>
            ) : isAudio && blobUrl ? (
              <div className="w-full flex-1 flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-[#0B0F1A] border border-slate-800 rounded-3xl space-y-6 text-center shadow-2xl">
                  <Music className="w-16 h-16 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="font-extrabold text-white text-lg">{filename}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">{mimeType}</p>
                  </div>
                  <audio
                    src={blobUrl}
                    controls
                    controlsList={isViewOnly ? 'nodownload' : undefined}
                    className="w-full"
                  />
                </div>
              </div>
            ) : isText && textContent !== null ? (
              <div
                contentEditable={false}
                className={`w-full flex-1 bg-[#0B0F1A] border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-y-auto overflow-x-hidden text-left font-mono text-xs sm:text-sm text-slate-200 shadow-2xl ${isViewOnly ? 'select-none' : ''}`}
                onCopy={(e) => {
                  if (isViewOnly) e.preventDefault();
                }}
              >
                <pre className="whitespace-pre-wrap break-words select-none m-0 p-0 leading-relaxed font-mono">{textContent}</pre>
              </div>
            ) : (
              <div className="w-full flex-1 flex items-center justify-center">
                <div className="max-w-md p-8 bg-[#0B0F1A] border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
                  <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
                  <div>
                    <h4 className="font-extrabold text-white text-base">{filename}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">{mimeType || 'Binary file format'}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In-app visual rendering is not natively supported for this binary format. Content has been decrypted and verified against AES-256 GCM authentication tags.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Notice */}
          <div className="bg-[#0D1224] border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 z-20">
            <span className="flex items-center gap-1.5 font-mono text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              FileVault AI Cryptographic Viewer Boundary
            </span>
            <span>
              {isViewOnly
                ? 'VIEW ONLY: Content decrypted in memory. Download, copy, paste, and print endpoints blocked.'
                : 'Full access granted.'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
