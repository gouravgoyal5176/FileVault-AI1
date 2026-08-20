import React, { useState } from 'react';
import { Target, Shuffle, Calendar, Award, Sparkles, Clock, ChevronRight, Lock } from 'lucide-react';
import { getAvailableWeeks } from '../../data/weeks';

interface PracticeZoneProps {
  onStartQuiz: (settings: {
    mode: 'random' | 'week' | 'full';
    selectedWeeks: number[];
    questionCount: number;
    timerEnabled: boolean;
    timeLimitMinutes: number;
  }) => void;
}

export const PracticeZone: React.FC<PracticeZoneProps> = ({ onStartQuiz }) => {
  const availableWeeks = getAvailableWeeks();

  // Quiz setup modal/panel state
  const [activeTab, setActiveTab] = useState<'random' | 'week' | 'full'>('random');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  const handleLaunch = () => {
    const weeksToUse = activeTab === 'week' ? [selectedWeekNum] : availableWeeks.map((w) => w.week);

    onStartQuiz({
      mode: activeTab,
      selectedWeeks: weeksToUse,
      questionCount: activeTab === 'full' ? 999 : questionCount,
      timerEnabled,
      timeLimitMinutes,
    });
  };

  return (
    <div className="py-10 md:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/20 mb-3">
            <Target className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              PRACTICE ZONE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900">
            NPTEL Exam Practice Hub
          </h1>

          <p className="mt-2 text-base text-slate-300 max-w-xl mx-auto dark:text-slate-300 light:text-slate-600">
            Configure custom practice tests, test your retention, and prepare under exam conditions.
          </p>
        </div>

        {/* Current Year Practice Hub */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-12 border border-indigo-500/20">
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900">
                Current Year Practice
              </h2>
              <p className="text-xs text-slate-400">
                Interactive quizzes compiled from active course weeks (Weeks 1 – {availableWeeks.length})
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-8">
            <button
              onClick={() => setActiveTab('random')}
              className={`flex flex-col items-center p-3.5 sm:p-4 rounded-2xl border transition-all text-center ${
                activeTab === 'random'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/15'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shuffle className={`h-5 w-5 mb-1.5 ${activeTab === 'random' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-xs sm:text-sm font-bold">Random Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('week')}
              className={`flex flex-col items-center p-3.5 sm:p-4 rounded-2xl border transition-all text-center ${
                activeTab === 'week'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/15'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className={`h-5 w-5 mb-1.5 ${activeTab === 'week' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-xs sm:text-sm font-bold">Select Week</span>
            </button>

            <button
              onClick={() => setActiveTab('full')}
              className={`flex flex-col items-center p-3.5 sm:p-4 rounded-2xl border transition-all text-center ${
                activeTab === 'full'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/15'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className={`h-5 w-5 mb-1.5 ${activeTab === 'full' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="text-xs sm:text-sm font-bold">Full Course Exam</span>
            </button>
          </div>

          {/* Tab Specific Configuration Form */}
          <div className="rounded-2xl bg-[#090D18]/90 p-5 sm:p-6 border border-white/5 space-y-6">
            
            {/* Week Selector if 'week' mode */}
            {activeTab === 'week' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Select Target Week:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {availableWeeks.map((w) => (
                    <button
                      key={w.week}
                      onClick={() => setSelectedWeekNum(w.week)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedWeekNum === w.week
                          ? 'bg-indigo-500 text-white border-indigo-400 font-bold shadow-md'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">Week {w.week}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{w.questions.length} Questions</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Count Selector (if not 'full' mode) */}
            {activeTab !== 'full' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Number of Questions:
                </label>
                <div className="flex items-center space-x-3">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        questionCount === count
                          ? 'bg-indigo-500/30 text-white border-indigo-400'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timer Toggle Settings */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                    Timed Exam Mode
                  </h4>
                  <p className="text-xs text-slate-400">
                    Simulate real test pressure with countdown timer
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    timerEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      timerEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {timerEnabled && (
                  <select
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="rounded-lg bg-slate-900 border border-white/10 px-3 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                )}
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={handleLaunch}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 py-3.5 text-base font-extrabold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all duration-200 min-h-[48px]"
            >
              <span>Start Practice Session</span>
              <ChevronRight className="h-5 w-5" />
            </button>

          </div>
        </div>

        {/* Previous Year Archives Architecture Card */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/5 opacity-90">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 border border-white/5">
                <Lock className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">
                    Previous Year Archives
                  </h3>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                    Archive Architecture Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Previous year NPTEL exam question papers (2025, 2024...) will be unlocked here as questions are populated.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
