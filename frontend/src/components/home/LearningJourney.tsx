import React from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { getAvailableWeeks } from '../../data/weeks';

interface LearningJourneyProps {
  onSelectWeek: (weekNumber: number) => void;
}

export const LearningJourney: React.FC<LearningJourneyProps> = ({ onSelectWeek }) => {
  const availableWeeks = getAvailableWeeks();

  return (
    <section className="py-16 md:py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/20 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              COURSE STRUCTURE
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900">
            Your Learning Journey
          </h2>
          
          <p className="mt-3 text-base text-slate-300 max-w-xl dark:text-slate-300 light:text-slate-600">
            Explore the course week by week with dedicated practice questions and explanations.
          </p>
        </div>

        {/* Available Weeks Editorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableWeeks.map((weekData) => {
            return (
              <div
                key={weekData.week}
                onClick={() => onSelectWeek(weekData.week)}
                className="group cursor-pointer relative overflow-hidden rounded-2xl border border-indigo-500/15 bg-[#0D1322]/80 p-6 sm:p-7 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/40 hover:shadow-indigo-500/10 dark:bg-[#0D1322]/80 light:bg-white light:border-slate-200 light:hover:border-indigo-300"
              >
                {/* Subtle top subtle glowing line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-teal-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Week Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/20">
                    Week {weekData.week < 10 ? `0${weekData.week}` : weekData.week}
                  </span>

                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300 border border-white/5 dark:bg-slate-900/80 light:bg-slate-100 light:text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{weekData.questions.length} Questions</span>
                  </span>
                </div>

                {/* Week Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-200 leading-snug dark:text-white light:text-slate-900 light:group-hover:text-indigo-600">
                  {weekData.title}
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-sm text-slate-400 line-clamp-2 leading-relaxed dark:text-slate-400 light:text-slate-600">
                  {weekData.description}
                </p>

                {/* Footer Action */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5 light:border-slate-100">
                  <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-300 transition-colors">
                    Study Questions
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-200">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
