import { Activity, KeyRound, Upload, Download, Share2, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  logs: AuditLog[];
  loading: boolean;
}

export function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
  const getActionIcon = (type: string) => {
    if (type.includes('LOGIN')) return <KeyRound className="w-3.5 h-3.5 text-indigo-600" />;
    if (type.includes('UPLOAD')) return <Upload className="w-3.5 h-3.5 text-blue-600" />;
    if (type.includes('DOWNLOAD')) return <Download className="w-3.5 h-3.5 text-emerald-600" />;
    if (type.includes('SHARE')) return <Share2 className="w-3.5 h-3.5 text-purple-600" />;
    if (type.includes('HONEYFILE') || type.includes('TAMPER')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
    return <Activity className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getBadgeStyle = (type: string) => {
    if (type.includes('FAILED') || type.includes('TAMPER') || type.includes('HONEYFILE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" /> Recent Vault Activity
        </h3>
        <span className="text-[11px] font-medium text-slate-500">Live Telemetry</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium">Polling security activity logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium">No recent activity recorded yet.</div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                {getActionIcon(log.actionType)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getBadgeStyle(log.actionType)}`}>
                    {log.actionType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  IP: {log.ipAddress} • {log.userAgent.substring(0, 30)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
