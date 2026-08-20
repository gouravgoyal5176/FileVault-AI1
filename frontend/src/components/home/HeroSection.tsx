import React from 'react';
import { ArrowRight, Play, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';
import { MindVisualHero } from './MindVisualHero';

interface HeroSectionProps {
  onExploreWeeks: () => void;
  onStartPractice: () => void;
  availableWeeksCount: number;
  totalQuestionsCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreWeeks,
  onStartPractice,
  availableWeeksCount,
  totalQuestionsCount,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Subtle Background Radial Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-hero-radial pointer-events-none opacity-80" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text Content */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            
            {/* Small Label Badge */}
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1.5 border border-indigo-500/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                NPTEL • STUDENT LEARNING PLATFORM
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] dark:text-white light:text-slate-900">
              Psychology Of Stress, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
                Health And Well-Being
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed dark:text-slate-300 light:text-slate-600">
              Study weekly questions, understand the answers, and prepare smarter for your NPTEL exam.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={onExploreWeeks}
                className="group flex min-h-[48px] items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>Explore Weeks</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onStartPractice}
                className="flex min-h-[48px] items-center justify-center space-x-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-3.5 text-base font-semibold text-slate-200 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all duration-200 dark:text-slate-200 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
              >
                <Play className="h-4 w-4 text-teal-400 fill-teal-400/20" />
                <span>Start Practice</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-indigo-500/10 w-full">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>{availableWeeksCount} Weeks Currently Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>{totalQuestionsCount} Course Questions</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Graphic Visual */}
          <div className="lg:col-span-5 w-full">
            <MindVisualHero />
          </div>

        </div>
      </div>
    </section>
  );
};
