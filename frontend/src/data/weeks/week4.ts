import { WeekData } from '../../types/quiz';

/**
 * ============================================================================
 * SAMPLE DEVELOPMENT DATA ONLY
 * ----------------------------------------------------------------------------
 * Replace the contents of this file with your actual NPTEL course questions.
 * The UI will dynamically adjust to the number of questions added here.
 * ============================================================================
 */
export const week4Data: WeekData = {
  week: 4,
  title: "Coping Strategies, Locus of Control & Hardiness",
  description: "Problem-focused vs Emotion-focused coping mechanisms, Julian Rotter's Locus of Control, Kobasa's Psychological Hardiness, and Resilience.",
  questions: [
    {
      id: "w4-q1",
      week: 4,
      question: "Directly attempting to change or eliminate the source of a stressor is known as:",
      options: {
        A: "Emotion-focused coping",
        B: "Problem-focused coping",
        C: "Avoidant denial coping",
        D: "Physiological habituation"
      },
      answer: "B",
      explanation: "Problem-focused coping targets the causes of stress in practical ways (e.g., problem-solving, action planning, acquiring new skills).",
      topic: "Coping Mechanisms"
    },
    {
      id: "w4-q2",
      week: 4,
      question: "Which of the following is an example of Emotion-Focused Coping?",
      options: {
        A: "Creating a daily study schedule to prepare for an exam",
        B: "Practicing deep breathing exercises and mindfulness to manage anxiety",
        C: "Hiring a private tutor to master difficult material",
        D: "Reorganizing workspace for better efficiency"
      },
      answer: "B",
      explanation: "Emotion-focused coping aims to regulate the emotional distress associated with a stressor when the stressor itself cannot be immediately altered.",
      topic: "Coping Mechanisms"
    },
    {
      id: "w4-q3",
      week: 4,
      question: "An individual with an Internal Locus of Control generally believes that:",
      options: {
        A: "Outcomes in life are predominantly determined by luck, fate, or powerful others",
        B: "Their own actions, decisions, and effort directly influence life outcomes",
        C: "Stress is entirely unpredictable and uncontrollable",
        D: "Cognitive appraisals are biologically predetermined"
      },
      answer: "B",
      explanation: "Internal Locus of Control (Rotter) reflects the belief that one's personal choices and effort determine outcomes.",
      topic: "Locus of Control"
    },
    {
      id: "w4-q4",
      week: 4,
      question: "Suzanne Kobasa identified three key components of Psychological Hardiness (the 3 Cs). What are they?",
      options: {
        A: "Control, Commitment, and Challenge",
        B: "Calm, Communication, and Care",
        C: "Cognition, Cortisol, and Catharsis",
        D: "Conscientiousness, Compassion, and Courage"
      },
      answer: "A",
      explanation: "Psychological Hardiness comprises Commitment (feeling involved), Control (belief in personal influence), and Challenge (viewing change as opportunity).",
      topic: "Psychological Hardiness"
    },
    {
      id: "w4-q5",
      week: 4,
      question: "Resilience in psychology refers to:",
      options: {
        A: "The total absence of any emotional reactivity to negative events",
        B: "The capacity to bounce back, adapt, and recover effectively from adversity",
        C: "A rigid adherence to routine during periods of crisis",
        D: "Biological immunity to cortisol elevation"
      },
      answer: "B",
      explanation: "Resilience describes the ability to adapt positively and rebound after experiencing significant adversity, trauma, or ongoing strain.",
      topic: "Resilience"
    }
  ]
};

export default week4Data;
