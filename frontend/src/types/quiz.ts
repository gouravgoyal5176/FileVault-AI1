export interface Question {
  id: string;
  week: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic?: string;
}

export interface WeekData {
  week: number;
  title: string;
  description: string;
  questions: Question[];
}

export type QuizMode = 'random' | 'week' | 'full';

export interface QuizSettings {
  mode: QuizMode;
  selectedWeeks: number[];
  questionCount: number;
  timerEnabled: boolean;
  timeLimitMinutes: number;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  userAnswers: UserAnswer[];
  questions: Question[];
  completedAt: string;
}

export interface Bookmark {
  questionId: string;
  week: number;
  savedAt: string;
}

export type ThemeMode = 'dark' | 'light';
