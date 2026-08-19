import { Upload, RefreshCw, ShieldCheck, Activity } from 'lucide-react';

interface QuickActionsProps {
  onOpenUpload: () => void;
  onRefresh: () => void;
  onNavigateSecurity: () => void;
}

export function QuickActions({ onOpenUpload, onRefresh, onNavigateSecurity }: QuickActionsProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenUpload}
          className="p-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <Upload className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold">Upload File</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <RefreshCw className="w-5 h-5 text-slate-600 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-bold">Refresh Vault</span>
        </button>

        <button
          onClick={onNavigateSecurity}
          className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold">Security Score</span>
        </button>

        <button
          onClick={onNavigateSecurity}
          className="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <Activity className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold">Audit Explorer</span>
        </button>
      </div>
    </div>
  );
}
