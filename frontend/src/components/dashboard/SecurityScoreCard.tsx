import { Award, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'GOOD':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-2xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 flex flex-col justify-between space-y-4 dark:hover:border-indigo-500/40 dark:hover:shadow-indigo-500/10 light:hover:border-slate-300 light:hover:shadow-lg light:hover:shadow-slate-200/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Posture Score
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition cursor-pointer"
          title="Refresh Score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !score ? (
        <div className="py-2 space-y-3 animate-pulse">
          <div className="h-8 bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-200 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-200 rounded-md w-full" />
          <div className="h-4 bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-200 rounded-md w-1/2" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight flex items-baseline gap-1">
                {score.finalScore}
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium mt-1">Deterministic 5-Vector Score</p>
            </div>

            {/* Circular Gauge SVG */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800 dark:text-slate-800 light:text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${score.finalScore}, 100` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="text-indigo-500"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-white dark:text-white light:text-slate-900">{score.finalScore}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 text-xs">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getRatingBadge(score.rating)}`}>
              {score.rating}
            </span>

            <button
              onClick={onNavigateSecurity}
              className="text-xs font-semibold text-indigo-400 dark:text-indigo-400 light:text-indigo-600 hover:text-indigo-300 dark:hover:text-indigo-300 light:hover:text-indigo-700 transition cursor-pointer flex items-center gap-1"
            >
              <span>View Details</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
