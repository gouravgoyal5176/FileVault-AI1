import React, { useState } from 'react';
import { Question } from '../../types/quiz';
import { CheckCircle2, Bookmark, BookmarkCheck, Lightbulb, HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (questionId: string, week: number) => void;
  defaultShowAnswer?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isBookmarked,
  onToggleBookmark,
  defaultShowAnswer = true,
}) => {
  const [showExplanation, setShowExplanation] = useState(defaultShowAnswer);

  const formattedIndex = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-7 transition-all duration-200 border border-indigo-500/15 mb-6">
      
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-extrabold text-indigo-300 border border-indigo-500/30">
            {formattedIndex}
          </span>

          {question.topic && (
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-white/5 dark:bg-slate-800/80 light:bg-slate-100 light:text-slate-700">
              {question.topic}
            </span>
          )}
        </div>

        {/* Bookmark Button */}
        <button
          onClick={() => onToggleBookmark(question.id, question.week)}
          title={isBookmarked ? "Remove Bookmark" : "Save Question"}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
            isBookmarked
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5 dark:bg-slate-800/60 light:bg-slate-100 light:text-slate-600'
          }`}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-white" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-semibold text-white leading-snug mb-5 dark:text-white light:text-slate-900">
        {question.question}
      </h3>

      {/* Options List */}
      <div className="space-y-2.5 mb-6">
        {(['A', 'B', 'C', 'D'] as const).map((key) => {
          const optionText = question.options[key];
          const isCorrect = key === question.answer;

          return (
            <div
              key={key}
              className={`flex items-start space-x-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                isCorrect && showExplanation
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900'
                  : 'bg-[#0A0E1A]/60 border-white/5 text-slate-300 dark:bg-[#0A0E1A]/60 light:bg-slate-50 light:border-slate-200 light:text-slate-700'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isCorrect && showExplanation
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 dark:bg-slate-800 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                {key}
              </span>
              <span className="text-sm font-medium pt-0.5 leading-normal">
                {optionText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Answer & Explanation Section */}
      <div className="pt-4 border-t border-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Correct Answer:</span>
            <span className="inline-flex items-center space-x-1.5 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Option {question.answer}</span>
            </span>
          </div>

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{showExplanation ? 'Hide Explanation' : 'View Explanation'}</span>
          </button>
        </div>

        {/* Explanation Rationale Box */}
        {showExplanation && (
          <div className="mt-3.5 rounded-xl bg-indigo-950/40 p-4 border border-indigo-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed dark:bg-indigo-950/40 light:bg-indigo-50/70 light:border-indigo-200 light:text-slate-700">
            <div className="flex items-center space-x-2 font-semibold text-indigo-300 mb-1.5 light:text-indigo-700">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Explanation & Concept Rationale</span>
            </div>
            <p>{question.explanation}</p>
          </div>
        )}
      </div>

    </div>
  );
};
