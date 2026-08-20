import React, { useState, useEffect } from 'react';
import { ThemeMode, QuizResult, QuizSettings } from './types/quiz';
import { getAvailableWeeks, getWeekByNumber, getRandomQuestions, getAllQuestions, getCourseStats } from './data/weeks';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/home/HeroSection';
import { CourseOverview } from './components/home/CourseOverview';
import { LearningJourney } from './components/home/LearningJourney';
import { WeekDetailView } from './components/weeks/WeekDetailView';
import { PracticeZone } from './components/practice/PracticeZone';
import { QuizEngine } from './components/quiz/QuizEngine';
import { QuizResultView } from './components/quiz/QuizResultView';
import { ReviewAnswersView } from './components/quiz/ReviewAnswersView';
import { BookmarksView } from './components/bookmarks/BookmarksView';
import { BookOpen, Sparkles, Target } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);

  // Theme State with LocalStorage Persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('mindprep_theme');
    return (saved as ThemeMode) || 'dark';
  });

  // Bookmarks State with LocalStorage Persistence
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mindprep_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);

  // Apply Theme Class to Document Body / Root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('mindprep_theme', theme);
  }, [theme]);

  // Persist Bookmarks
  useEffect(() => {
    localStorage.setItem('mindprep_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleBookmark = (questionId: string) => {
    setBookmarks((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleNavigate = (view: string, param?: any) => {
    if (view === 'week-detail' && typeof param === 'number') {
      setSelectedWeekNum(param);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Practice Quiz
  const handleStartQuiz = (settings: QuizSettings) => {
    setQuizSettings(settings);

    let questionsToUse: any[] = [];
    if (settings.mode === 'week' && settings.selectedWeeks.length > 0) {
      const weekData = getWeekByNumber(settings.selectedWeeks[0]);
      questionsToUse = weekData ? [...weekData.questions] : [];
    } else {
      questionsToUse = getRandomQuestions(settings.questionCount, settings.selectedWeeks);
    }

    if (!questionsToUse.length) {
      questionsToUse = getAllQuestions();
    }

    setQuizQuestions(questionsToUse);
    setCurrentView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartWeekQuiz = (weekNum: number) => {
    const weekData = getWeekByNumber(weekNum);
    if (!weekData) return;

    handleStartQuiz({
      mode: 'week',
      selectedWeeks: [weekNum],
      questionCount: weekData.questions.length,
      timerEnabled: true,
      timeLimitMinutes: 15,
    });
  };

  const handleCompleteQuiz = (result: QuizResult) => {
    setLastQuizResult(result);
    setCurrentView('quiz-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const availableWeeks = getAvailableWeeks();
  const courseStats = getCourseStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100 dark:bg-[#070A12] dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-300">
      
      {/* Global Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        bookmarkCount={bookmarks.length}
        availableWeeksCount={availableWeeks.length}
      />

      {/* Main Content Router View */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div>
            <HeroSection
              onExploreWeeks={() => handleNavigate('weeks')}
              onStartPractice={() => handleNavigate('practice')}
              availableWeeksCount={courseStats.availableWeeksCount}
              totalQuestionsCount={courseStats.totalQuestionsCount}
            />

            <CourseOverview />

            <LearningJourney
              onSelectWeek={(weekNum) => handleNavigate('week-detail', weekNum)}
            />

            {/* Why Study Here / Features Section */}
            <section className="py-16 border-t border-indigo-500/10 bg-[#090E1B]/50 dark:bg-[#090E1B]/50 light:bg-slate-100/60 light:border-slate-200">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    PLATFORM ADVANTAGES
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 dark:text-white light:text-slate-900">
                    Built Specifically for NPTEL Students
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mb-4">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 dark:text-white light:text-slate-900">
                      Week-by-Week Breakdown
                    </h3>
                    <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                      All questions are neatly categorized by NPTEL course weeks so you can study along with your lecture releases.
                    </p>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 mb-4">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 dark:text-white light:text-slate-900">
                      Clear Explanations
                    </h3>
                    <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                      Every question includes detailed rationale explaining why the correct option is right and reinforcing key concepts.
                    </p>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 mb-4">
                      <Target className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 dark:text-white light:text-slate-900">
                      Exam Practice Modes
                    </h3>
                    <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                      Test yourself under timed exam conditions, flag questions to review, and track your instant score accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentView === 'weeks' && (
          <LearningJourney
            onSelectWeek={(weekNum) => handleNavigate('week-detail', weekNum)}
          />
        )}

        {currentView === 'week-detail' && (
          <WeekDetailView
            weekData={getWeekByNumber(selectedWeekNum) || availableWeeks[0]}
            onNavigate={handleNavigate}
            onStartWeekQuiz={handleStartWeekQuiz}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {currentView === 'practice' && (
          <PracticeZone onStartQuiz={handleStartQuiz} />
        )}

        {currentView === 'quiz' && (
          <QuizEngine
            questions={quizQuestions}
            timerEnabled={quizSettings?.timerEnabled ?? true}
            timeLimitMinutes={quizSettings?.timeLimitMinutes ?? 15}
            onCompleteQuiz={handleCompleteQuiz}
            onCancelQuiz={() => handleNavigate('practice')}
          />
        )}

        {currentView === 'quiz-result' && lastQuizResult && (
          <QuizResultView
            result={lastQuizResult}
            onReviewAnswers={() => handleNavigate('review-answers')}
            onTryAgain={() => handleStartQuiz(quizSettings || {
              mode: 'random',
              selectedWeeks: [],
              questionCount: 10,
              timerEnabled: true,
              timeLimitMinutes: 15,
            })}
            onBackToPractice={() => handleNavigate('practice')}
          />
        )}

        {currentView === 'review-answers' && lastQuizResult && (
          <ReviewAnswersView
            result={lastQuizResult}
            onBackToResults={() => handleNavigate('quiz-result')}
            onBackToPractice={() => handleNavigate('practice')}
          />
        )}

        {currentView === 'bookmarks' && (
          <BookmarksView
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
};

export default App;
