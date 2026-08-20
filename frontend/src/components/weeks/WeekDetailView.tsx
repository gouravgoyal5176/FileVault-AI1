import React, { useState } from 'react';
import { WeekData } from '../../types/quiz';
import { QuestionCard } from './QuestionCard';
import { Search, Filter, BookOpen, Play, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { getAvailableWeeks } from '../../data/weeks';

interface WeekDetailViewProps {
  weekData: WeekData;
  onNavigate: (view: string, param?: any) => void;
  onStartWeekQuiz: (weekNum: number) => void;
  bookmarks: string[];
  onToggleBookmark: (questionId: string, week: number) => void;
}

export const WeekDetailView: React.FC<WeekDetailViewProps> = ({
  weekData,
  onNavigate,
  onStartWeekQuiz,
  bookmarks,
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showAllExplanations, setShowAllExplanations] = useState(true);

  const availableWeeks = getAvailableWeeks();

  // Extract unique topics for filtering
  const topics = Array.from(
    new Set(weekData.questions.map((q) => q.topic).filter(Boolean))
  ) as string[];

  // Filter questions based on search & selected topic
  const filteredQuestions = weekData.questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(q.options).some((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTopic = selectedTopic ? q.topic === selectedTopic : true;

    return matchesSearch && matchesTopic;
  });

  return (
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-6">
          <button onClick={() => onNavigate('home')} className="hover:text-indigo-400 transition-colors">
            Home
          </button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => onNavigate('weeks')} className="hover:text-indigo-400 transition-colors">
            Weeks
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-indigo-400">Week {weekData.week}</span>
        </nav>

        {/* Sticky Quick Week Switcher Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
            Jump to:
          </span>
          {availableWeeks.map((w) => {
            const isActive = w.week === weekData.week;
            return (
              <button
                key={w.week}
                onClick={() => onNavigate('week-detail', w.week)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5 dark:bg-slate-900/80 light:bg-slate-200 light:text-slate-700'
                }`}
              >
                Week {w.week}
              </button>
            );
          })}
        </div>

        {/* Main Week Title & Header Box */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8 border border-indigo-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="inline-flex items-center rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                  Week {weekData.week < 10 ? `0${weekData.week}` : weekData.week}
                </span>
                <span className="text-xs text-slate-400">
                  {weekData.questions.length} Practice Questions
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900">
                {weekData.title}
              </h1>

              <p className="mt-2 text-sm text-slate-300 max-w-2xl dark:text-slate-300 light:text-slate-600">
                {weekData.description}
              </p>
            </div>

            {/* Quick Practice CTA */}
            <button
              onClick={() => onStartWeekQuiz(weekData.week)}
              className="flex items-center justify-center space-x-2 shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Practice Week {weekData.week} Quiz</span>
            </button>
          </div>
        </div>

        {/* Search & Topic Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or terms..."
              className="w-full rounded-xl bg-[#0C1220] border border-indigo-500/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-[#0C1220] dark:text-white light:bg-white light:border-slate-300 light:text-slate-900"
            />
          </div>

          {/* Explanation Toggle */}
          <button
            onClick={() => setShowAllExplanations(!showAllExplanations)}
            className="flex items-center justify-center space-x-2 rounded-xl bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-white/5 hover:bg-slate-800 transition-all dark:bg-slate-900/80 light:bg-slate-100 light:text-slate-700"
          >
            {showAllExplanations ? (
              <>
                <EyeOff className="h-4 w-4 text-indigo-400" />
                <span>Hide Explanations</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-indigo-400" />
                <span>Show Explanations</span>
              </>
            )}
          </button>
        </div>

        {/* Topic Badges Filter */}
        {topics.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => setSelectedTopic(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedTopic === null
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 dark:bg-slate-900/80 light:bg-slate-100 light:text-slate-700'
              }`}
            >
              All Topics
            </button>
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t === selectedTopic ? null : t)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedTopic === t
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 dark:bg-slate-900/80 light:bg-slate-100 light:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Question Cards List */}
        {filteredQuestions.length > 0 ? (
          <div>
            {filteredQuestions.map((question, idx) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={idx}
                isBookmarked={bookmarks.includes(question.id)}
                onToggleBookmark={onToggleBookmark}
                defaultShowAnswer={showAllExplanations}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-indigo-500/20">
            <BookOpen className="h-10 w-10 text-indigo-400/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
              No matching questions found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Try clearing your search query or topic filter.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
