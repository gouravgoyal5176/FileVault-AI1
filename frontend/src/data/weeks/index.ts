import { WeekData, Question } from '../../types/quiz';

/**
 * ============================================================================
 * DYNAMIC AUTOMATIC WEEK DISCOVERY REGISTRY
 * ----------------------------------------------------------------------------
 * Powered by Vite's import.meta.glob.
 * Whenever a new week file is created (e.g. week6.ts, week7.ts ... week12.ts)
 * inside src/data/weeks/, Vite automatically discovers and includes it here.
 * ZERO MANUAL UPDATES REQUIRED!
 * ============================================================================
 */

// Import all files matching ./week*.ts eager loaded
const weekModules = import.meta.glob<{ default?: WeekData; [key: string]: unknown }>('./week*.ts', { eager: true });

const loadedWeeks: WeekData[] = [];

Object.keys(weekModules).forEach((path) => {
  const mod = weekModules[path];
  // Extract week data either from default export or named export
  const weekData = (mod.default || Object.values(mod).find((val) => val && typeof val === 'object' && 'week' in val)) as WeekData | undefined;

  if (weekData && typeof weekData.week === 'number' && Array.isArray(weekData.questions)) {
    loadedWeeks.push(weekData);
  }
});

// Sort by week number in ascending order (Week 1, Week 2...)
loadedWeeks.sort((a, b) => a.week - b.week);

/**
 * Get all currently available weeks in the data layer.
 * Only existing weeks are returned (No fake, locked, or upcoming weeks).
 */
export const getAvailableWeeks = (): WeekData[] => {
  return loadedWeeks;
};

/**
 * Fetch a specific week by its week number.
 */
export const getWeekByNumber = (weekNum: number): WeekData | undefined => {
  return loadedWeeks.find((w) => w.week === weekNum);
};

/**
 * Fetch all questions across all available weeks.
 */
export const getAllQuestions = (): Question[] => {
  return loadedWeeks.flatMap((w) => w.questions);
};

/**
 * Fetch questions filtered by selected week numbers.
 */
export const getQuestionsForWeeks = (weekNums: number[]): Question[] => {
  if (!weekNums.length) return getAllQuestions();
  return loadedWeeks
    .filter((w) => weekNums.includes(w.week))
    .flatMap((w) => w.questions);
};

/**
 * Fetch a randomized array of questions of given count.
 */
export const getRandomQuestions = (count: number, weekNums: number[] = []): Question[] => {
  const pool = getQuestionsForWeeks(weekNums);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Calculate dynamic, honest neutral course statistics directly from active data.
 */
export const getCourseStats = () => {
  const weeks = getAvailableWeeks();
  const totalQuestions = weeks.reduce((sum, w) => sum + w.questions.length, 0);
  const topicsSet = new Set<string>();
  
  weeks.forEach((w) => {
    w.questions.forEach((q) => {
      if (q.topic) topicsSet.add(q.topic);
    });
  });

  return {
    availableWeeksCount: weeks.length,
    totalQuestionsCount: totalQuestions,
    practiceModesCount: 3, // Random Quiz, Week Quiz, Full Course Quiz
    coveredTopicsCount: topicsSet.size || weeks.length * 3
  };
};
