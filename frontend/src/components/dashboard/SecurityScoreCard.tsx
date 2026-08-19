import { Award, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ScoreData {
  finalScore: number;
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL_RISK';
  evaluatedAt: string;
}

interface SecurityScoreCardProps {
  score: ScoreData | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateSecurity: () => void;
}

export function SecurityScoreCard({ score, loading, onRefresh, onNavigateSecurity }: SecurityScoreCardProps) {
  const getRatingBadge = (rating?: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'GOOD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MODERATE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" /> Posture Score
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          title="Refresh Score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !score ? (
        <div className="py-2 space-y-3 animate-pulse">
          <div className="h-8 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-100 rounded-md w-full" />
          <div className="h-4 bg-slate-100 rounded-md w-1/2" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                {score.finalScore}
                <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Deterministic 5-Vector Score</p>
            </div>

            {/* Circular Progress Gauge UI */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${score.finalScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-slate-800">{score.finalScore}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getRatingBadge(score.rating)}`}>
              {score.rating}
            </span>

            <button
              onClick={onNavigateSecurity}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
            >
              <span>View Details</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
