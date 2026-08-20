import { WeekData } from '../../types/quiz';

/**
 * ============================================================================
 * SAMPLE DEVELOPMENT DATA ONLY
 * ----------------------------------------------------------------------------
 * Replace the contents of this file with your actual NPTEL course questions.
 * The UI will dynamically adjust to the number of questions added here.
 * ============================================================================
 */
export const week1Data: WeekData = {
  week: 1,
  title: "Introduction to Stress & Physiological Foundations",
  description: "Core concepts of stress, physiological arousal mechanisms, Cannon's fight-or-flight response, and homeostasis.",
  questions: [
    {
      id: "w1-q1",
      week: 1,
      question: "Which researcher coined the term 'Fight-or-Flight' response to describe the body's acute physiological response to threat?",
      options: {
        A: "Hans Selye",
        B: "Walter Cannon",
        C: "Richard Lazarus",
        D: "Robert Sapolsky"
      },
      answer: "B",
      explanation: "Walter Cannon introduced the term 'Fight-or-Flight' response in 1915, describing the sympathetic nervous system activation during immediate survival threats.",
      topic: "Foundations of Stress"
    },
    {
      id: "w1-q2",
      week: 1,
      question: "Homeostasis refers to:",
      options: {
        A: "The body's process of maintaining internal stability despite external change",
        B: "The permanent physiological breakdown caused by chronic stress",
        C: "The cognitive appraisal of threat severity",
        D: "The psychological coping mechanism of emotional suppression"
      },
      answer: "A",
      explanation: "Homeostasis describes the physiological balance and stability maintained by regulatory systems within biological organisms.",
      topic: "Physiological Balance"
    },
    {
      id: "w1-q3",
      week: 1,
      question: "Which branch of the autonomic nervous system is primarily responsible for triggering stress arousal?",
      options: {
        A: "Parasympathetic Nervous System",
        B: "Sympathetic Nervous System",
        C: "Somatic Nervous System",
        D: "Central Nervous System"
      },
      answer: "B",
      explanation: "The Sympathetic Nervous System accelerates heart rate, dilates airways, and releases adrenaline during perceived threats.",
      topic: "Autonomic Nervous System"
    },
    {
      id: "w1-q4",
      week: 1,
      question: "What is Eustress as defined in stress psychology?",
      options: {
        A: "Severe debilitating psychological distress",
        B: "Positive or constructive stress that enhances motivation and performance",
        C: "Stress caused exclusively by environmental noise",
        D: "Unconscious psychological defense mechanisms"
      },
      answer: "B",
      explanation: "Eustress represents positive stress (e.g., excitement before an event or athletic performance) that mobilizes energy productively.",
      topic: "Types of Stress"
    },
    {
      id: "w1-q5",
      week: 1,
      question: "Which hormone is rapidly released by the adrenal medulla during immediate sympathetic arousal?",
      options: {
        A: "Melatonin",
        B: "Epinephrine (Adrenaline)",
        C: "Thyroxine",
        D: "Insulin"
      },
      answer: "B",
      explanation: "Epinephrine (Adrenaline) is released into the bloodstream by the adrenal medulla during acute sympathetic activation.",
      topic: "Endocrine Response"
    }
  ]
};

export default week1Data;
