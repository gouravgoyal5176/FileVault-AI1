import { Question } from '../../types/quiz';

/**
 * ============================================================================
 * PREVIOUS YEAR QUESTION ARCHIVE DATA ARCHITECTURE
 * ----------------------------------------------------------------------------
 * This structure supports future NPTEL previous-year question sets (2025, 2024, etc.).
 * Populate this archive when previous-year questions are available.
 * ============================================================================
 */

export interface PreviousYearArchive {
  year: number;
  term: 'Jan-Apr' | 'Jul-Oct' | string;
  title: string;
  totalQuestions: number;
  isAvailable: boolean;
  questions: Question[];
}

export const previousYearArchives: PreviousYearArchive[] = [
  {
    year: 2025,
    term: "Jan-Apr",
    title: "2025 Previous Year Examination Set",
    totalQuestions: 0,
    isAvailable: false,
    questions: []
  },
  {
    year: 2024,
    term: "Jul-Oct",
    title: "2024 Previous Year Examination Set",
    totalQuestions: 0,
    isAvailable: false,
    questions: []
  }
];

export const getPreviousYearArchives = (): PreviousYearArchive[] => {
  return previousYearArchives;
};
