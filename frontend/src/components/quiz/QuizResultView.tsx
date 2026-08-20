import React, { useEffect } from 'react';
import { QuizResult } from '../../types/quiz';
import { Award, CheckCircle2, XCircle, Clock, RotateCcw, Eye, Target, Sparkles } from 'lucide-react';

interface QuizResultViewProps {
  result: QuizResult;
  onReviewAnswers: () => void;
  onTryAgain: () => void;
  onBackToPractice: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  result,
  onReviewAnswers,
  onTryAgain,
  onBackToPractice,
}) => {
  // Trigger celebration confetti on mount if high score (>= 70%)
  useEffect(() => {
    if (result.percentage >= 70) {
      import('canvas-confetti')
        .then((confettiModule) => {
          const confetti = confettiModule.default;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#14b8a6', '#8b5cf6'],
          });
        })
        .catch(() => {
          // Fallback gracefully if confetti module not available
        });
    }
  }, [result.percentage]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Performance message based on score
  const getFeedbackMessage = (pct: number) => {
    if (pct >= 90) return { title: "Outstanding Mastery!", desc: "Excellent performance! You have a deep grasp of this material." };
    if (pct >= 75) return { title: "Great Job!", desc: "Solid performance. Review the few missed questions to polish your knowledge." };
    if (pct >= 50) return { title: "Good Attempt!", desc: "You passed, but reviewing explanations will boost your score further." };
    return { title: "Keep Practicing!", desc: "Review the answers carefully and attempt the quiz again to build confidence." };
  };

  const feedback = getFeedbackMessage(result.percentage);

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Result Card */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-indigo-500/25 text-center shadow-2xl">
          
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/15 px-4 py-1.5 border border-indigo-500/30 mb-6">
            <Award className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              QUIZ COMPLETE
            </span>
          </div>

          {/* Feedback Headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900 mb-2">
            {feedback.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-md mx-auto mb-8 dark:text-slate-300 light:text-slate-600">
            {feedback.desc}
          </p>

          {/* Score Circle / Badge */}
          <div className="relative inline-flex items-center justify-center p-8 rounded-full bg-gradient-to-b from-indigo-900/40 to-slate-950/80 border-2 border-indigo-500/30 mb-8 shadow-inner">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {result.score} <span className="text-xl text-slate-400 font-normal">/ {result.totalQuestions}</span>
              </div>
              <div className="text-sm font-bold text-teal-400 mt-1">
                {result.percentage}% Accuracy
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
            <div className="rounded-2xl bg-[#0A0E1A]/80 p-4 border border-white/5 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{result.correctCount}</div>
              <div className="text-[11px] font-medium text-slate-400">Correct</div>
            </div>

            <div className="rounded-2xl bg-[#0A0E1A]/80 p-4 border border-white/5 text-center">
              <XCircle className="h-5 w-5 text-rose-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{result.incorrectCount}</div>
              <div className="text-[11px] font-medium text-slate-400">Incorrect</div>
            </div>

            <div className="rounded-2xl bg-[#0A0E1A]/80 p-4 border border-white/5 text-center">
              <Clock className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{formatSeconds(result.timeSpentSeconds)}</div>
              <div className="text-[11px] font-medium text-slate-400">Time Taken</div>
            </div>

            <div className="rounded-2xl bg-[#0A0E1A]/80 p-4 border border-white/5 text-center">
              <Sparkles className="h-5 w-5 text-violet-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{result.percentage}%</div>
              <div className="text-[11px] font-medium text-slate-400">Score Rate</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onReviewAnswers}
              className="w-full sm:w-auto flex min-h-[48px] items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all"
            >
              <Eye className="h-4 w-4" />
              <span>Review Answers</span>
            </button>

            <button
              onClick={onTryAgain}
              className="w-full sm:w-auto flex min-h-[48px] items-center justify-center space-x-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 text-sm font-bold text-slate-200 hover:bg-indigo-500/20 transition-all"
            >
              <RotateCcw className="h-4 w-4 text-teal-400" />
              <span>Try Again</span>
            </button>

            <button
              onClick={onBackToPractice}
              className="w-full sm:w-auto flex min-h-[48px] items-center justify-center space-x-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-all border border-white/5"
            >
              <Target className="h-4 w-4" />
              <span>Back to Practice</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
