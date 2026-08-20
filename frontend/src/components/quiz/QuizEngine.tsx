import React, { useState, useEffect } from 'react';
import { Question, QuizResult, UserAnswer } from '../../types/quiz';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, Grid, X, AlertCircle } from 'lucide-react';

interface QuizEngineProps {
  questions: Question[];
  timerEnabled: boolean;
  timeLimitMinutes: number;
  onCompleteQuiz: (result: QuizResult) => void;
  onCancelQuiz: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  timerEnabled,
  timeLimitMinutes,
  onCompleteQuiz,
  onCancelQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(timeLimitMinutes * 60);
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Countdown timer effect
  useEffect(() => {
    if (!timerEnabled) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // Auto submit on timer expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerEnabled]);

  // Format seconds MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const answersList: UserAnswer[] = questions.map((q) => {
      const selected = userAnswers[q.id] || null;
      const isCorrect = selected === q.answer;

      if (!selected) unansweredCount++;
      else if (isCorrect) correctCount++;
      else incorrectCount++;

      return {
        questionId: q.id,
        selectedOption: selected,
        isCorrect,
        timeSpentSeconds: 0,
      };
    });

    const score = correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const timeSpentSeconds = timerEnabled ? timeLimitMinutes * 60 - timeRemainingSeconds : 0;

    const result: QuizResult = {
      score,
      totalQuestions,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds,
      userAnswers: answersList,
      questions,
      completedAt: new Date().toISOString(),
    };

    onCompleteQuiz(result);
  };

  const answeredCount = Object.values(userAnswers).filter(Boolean).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="py-6 md:py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Control Bar */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-4 mb-6 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            
            {/* Question Counter */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-indigo-300">{progressPercent}%</span>
              </div>
            </div>

            {/* Timer & Matrix Controls */}
            <div className="flex items-center space-x-3">
              {timerEnabled && (
                <div className="flex items-center space-x-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-indigo-500/30 text-xs font-mono font-bold text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTime(timeRemainingSeconds)}</span>
                </div>
              )}

              {/* Question Drawer Matrix Toggle */}
              <button
                onClick={() => setShowMatrixDrawer(!showMatrixDrawer)}
                className="flex items-center space-x-1.5 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/5 hover:bg-slate-700 transition-colors"
              >
                <Grid className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Question Grid</span>
              </button>

              {/* Exit Quiz */}
              <button
                onClick={onCancelQuiz}
                title="Exit Quiz"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Matrix Drawer Grid overlay */}
        {showMatrixDrawer && (
          <div className="glass-panel mb-6 rounded-2xl p-5 border border-indigo-500/30 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Question Matrix Navigation ({answeredCount}/{totalQuestions} Answered)
              </span>
              <button onClick={() => setShowMatrixDrawer(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIndex;
                const isAnswered = !!userAnswers[q.id];
                const isFlagged = !!flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMatrixDrawer(false);
                    }}
                    className={`relative flex h-10 w-full items-center justify-center rounded-xl text-xs font-extrabold border transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white border-white ring-2 ring-indigo-400'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Question Card */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8 border border-indigo-500/20">
          
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              Question {currentIndex + 1}
            </span>

            {/* Flag for Review Button */}
            <button
              onClick={handleToggleFlag}
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                flaggedQuestions[currentQuestion.id]
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-white/5 hover:text-amber-300'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              <span>{flaggedQuestions[currentQuestion.id] ? 'Flagged' : 'Flag for Review'}</span>
            </button>
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed mb-6 dark:text-white light:text-slate-900">
            {currentQuestion.question}
          </h2>

          {/* Options Selection List */}
          <div className="space-y-3 mb-8">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const optionText = currentQuestion.options[key];
              const isSelected = userAnswers[currentQuestion.id] === key;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full flex items-start space-x-3.5 p-4 rounded-2xl border text-left transition-all min-h-[52px] ${
                    isSelected
                      ? 'bg-indigo-500/25 border-indigo-400 text-white shadow-md shadow-indigo-500/10'
                      : 'bg-[#0A0E1A]/80 border-white/5 text-slate-300 hover:border-indigo-500/30 hover:bg-[#0E1426]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm font-medium pt-0.5 leading-snug">
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-indigo-500/10">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 rounded-xl bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300 border border-white/5 disabled:opacity-40 hover:bg-slate-800 transition-all min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all min-h-[44px]"
              >
                <span>Next Question</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit Quiz</span>
              </button>
            )}
          </div>

        </div>

        {/* Submit Confirmation Dialog */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-indigo-500/30 text-center animate-in zoom-in-95 duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto mb-4 border border-indigo-500/30">
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">
                Ready to submit your quiz?
              </h3>

              <p className="text-xs text-slate-300 mt-2">
                You have answered <span className="font-bold text-indigo-400">{answeredCount}</span> out of{' '}
                <span className="font-bold">{totalQuestions}</span> questions.
              </p>

              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Continue Answering
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  Yes, Submit Now
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
