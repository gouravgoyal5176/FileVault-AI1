import React from 'react';
import { Calendar, HelpCircle, Layers, BookCheck } from 'lucide-react';
import { getCourseStats } from '../../data/weeks';

export const CourseOverview: React.FC = () => {
  const stats = getCourseStats();

  const statCards = [
    {
      label: 'Available Weeks',
      value: `${stats.availableWeeksCount}`,
      subtext: 'Active course modules',
      icon: Calendar,
      accent: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
    },
    {
      label: 'Total Questions',
      value: `${stats.totalQuestionsCount}`,
      subtext: 'Questions with rationale',
      icon: HelpCircle,
      accent: 'from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/30',
    },
    {
      label: 'Practice Modes',
      value: `${stats.practiceModesCount}`,
      subtext: 'Random, Week & Full Exam',
      icon: Layers,
      accent: 'from-violet-500/20 to-violet-600/5 text-violet-400 border-violet-500/30',
    },
    {
      label: 'Topics Covered',
      value: `${stats.coveredTopicsCount}`,
      subtext: 'Core psychological concepts',
      icon: BookCheck,
      accent: 'from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/30',
    },
  ];

  return (
    <section className="py-10 border-y border-indigo-500/10 bg-[#090D18]/60 dark:bg-[#090D18]/60 light:bg-slate-100/80 light:border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-400 light:text-slate-600">
                    {card.label}
                  </span>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${card.accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight dark:text-white light:text-slate-900">
                  {card.value}
                </div>

                <p className="text-xs text-slate-400 mt-1 dark:text-slate-400 light:text-slate-500">
                  {card.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
