import React, { useState } from 'react';
import { QuizResult } from '../../types/quiz';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface ReviewAnswersViewProps {
  result: QuizResult;
  onBackToResults: () => void;
  onBackToPractice: () => void;
}

export const ReviewAnswersView: React.FC<ReviewAnswersViewProps> = ({
  result,
  onBackToResults,
  onBackToPractice,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');

  const filteredUserAnswers = result.userAnswers.filter((ans) => {
    if (filterMode === 'incorrect') return !ans.isCorrect;
    if (filterMode === 'correct') return ans.isCorrect;
    return true;
  });

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button
            onClick={onBackToResults}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Score Summary</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Filter Review:</span>
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-white/5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({result.questions.length})
              </button>
              <button
                onClick={() => setFilterMode('incorrect')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'incorrect' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Incorrect ({result.incorrectCount})
              </button>
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Correct ({result.correctCount})
              </button>
            </div>
          </div>
        </div>

        {/* Question Review Cards List */}
        <div className="space-y-6">
          {filteredUserAnswers.map((userAns, idx) => {
            const question = result.questions.find((q) => q.id === userAns.questionId);
            if (!question) return null;

            const isCorrect = userAns.isCorrect;
            const selectedOpt = userAns.selectedOption;
            const correctOpt = question.answer;

            return (
              <div
                key={question.id}
                className={`glass-panel relative overflow-hidden rounded-2xl p-6 border transition-all ${
                  isCorrect
                    ? 'border-emerald-500/20 bg-emerald-950/10'
                    : 'border-rose-500/20 bg-rose-950/10'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-extrabold text-indigo-300">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs text-slate-400">Week {question.week}</span>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-base font-bold text-white mb-4 leading-snug dark:text-white light:text-slate-900">
                  {question.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5 mb-5">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const optionText = question.options[key];
                    const isSelectedByStudent = selectedOpt === key;
                    const isCorrectAnswer = correctOpt === key;

                    let optionBg = 'bg-[#0A0E1A]/60 border-white/5 text-slate-300';
                    if (isCorrectAnswer) {
                      optionBg = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold';
                    } else if (isSelectedByStudent && !isCorrect) {
                      optionBg = 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-semibold';
                    }

                    return (
                      <div
                        key={key}
                        className={`flex items-start space-x-3 p-3 sm:p-3.5 rounded-xl border transition-all ${optionBg}`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            isCorrectAnswer
                              ? 'bg-emerald-500 text-white'
                              : isSelectedByStudent && !isCorrect
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {key}
                        </span>

                        <div className="flex-1 text-xs sm:text-sm pt-0.5">
                          <span>{optionText}</span>
                          
                          {/* Tag labels */}
                          {isCorrectAnswer && (
                            <span className="ml-2 inline-flex items-center text-[10px] font-bold text-emerald-400 uppercase">
                              (Correct Answer)
                            </span>
                          )}
                          {isSelectedByStudent && !isCorrect && (
                            <span className="ml-2 inline-flex items-center text-[10px] font-bold text-rose-400 uppercase">
                              (Your Choice)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="rounded-xl bg-indigo-950/40 p-4 border border-indigo-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <div className="flex items-center space-x-2 font-semibold text-indigo-300 mb-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Explanation</span>
                  </div>
                  <p>{question.explanation}</p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer CTAs */}
        <div className="mt-8 text-center">
          <button
            onClick={onBackToPractice}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
          >
            Done Reviewing • Back to Practice
          </button>
        </div>

      </div>
    </div>
  );
};
