import React from 'react';
import { getAllQuestions } from '../../data/weeks';
import { QuestionCard } from '../weeks/QuestionCard';
import { Bookmark, Sparkles } from 'lucide-react';

interface BookmarksViewProps {
  bookmarks: string[];
  onToggleBookmark: (questionId: string, week: number) => void;
  onNavigate: (view: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  onToggleBookmark,
  onNavigate,
}) => {
  const allQuestions = getAllQuestions();
  const bookmarkedQuestions = allQuestions.filter((q) => bookmarks.includes(q.id));

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/20 mb-3">
            <Bookmark className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              SAVED QUESTIONS ({bookmarkedQuestions.length})
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900">
            Bookmarked Questions
          </h1>

          <p className="mt-2 text-sm text-slate-300 max-w-md dark:text-slate-300 light:text-slate-600">
            Review questions you saved for quick revision before exams.
          </p>
        </div>

        {/* Bookmarked Questions List */}
        {bookmarkedQuestions.length > 0 ? (
          <div className="space-y-6">
            {bookmarkedQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                isBookmarked={true}
                onToggleBookmark={onToggleBookmark}
                defaultShowAnswer={true}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel text-center py-16 px-6 rounded-3xl border border-indigo-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto mb-4 border border-indigo-500/20">
              <Bookmark className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">
              No saved questions yet
            </h3>

            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
              Click the bookmark icon on any question in a week module to save it here for fast revision.
            </p>

            <button
              onClick={() => onNavigate('weeks')}
              className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Browse Course Weeks</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
