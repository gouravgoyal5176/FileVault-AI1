import { HardDrive, Server } from 'lucide-react';

interface StorageCardProps {
  totalBytes: number;
  fileCount: number;
}

export function StorageCard({ totalBytes, fileCount }: StorageCardProps) {
  const maxBytes = 2 * 1024 * 1024 * 1024; // 2 GB standard allocation
  const percentage = Math.min(100, Math.max(1, (totalBytes / maxBytes) * 100));

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-600" /> Vault Storage Quota
        </span>
        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
          MinIO Object Store
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatSize(totalBytes)}{' '}
            <span className="text-xs text-slate-400 font-normal">/ 2.00 GB</span>
          </div>
          <span className="text-xs font-bold text-indigo-600">{percentage.toFixed(1)}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5 font-medium">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          Encrypted Payload Files
        </span>
        <span className="font-bold text-slate-800">{fileCount} Files</span>
      </div>
    </div>
  );
}
