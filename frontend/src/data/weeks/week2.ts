import { WeekData } from '../../types/quiz';

/**
 * ============================================================================
 * SAMPLE DEVELOPMENT DATA ONLY
 * ----------------------------------------------------------------------------
 * Replace the contents of this file with your actual NPTEL course questions.
 * The UI will dynamically adjust to the number of questions added here.
 * ============================================================================
 */
export const week2Data: WeekData = {
  week: 2,
  title: "Models of Stress: GAS & Transactional Model",
  description: "Hans Selye's General Adaptation Syndrome (Alarm, Resistance, Exhaustion) and Lazarus & Folkman's Transactional Model of Stress.",
  questions: [
    {
      id: "w2-q1",
      week: 2,
      question: "Which of the following represents the correct sequence of stages in Hans Selye's General Adaptation Syndrome (GAS)?",
      options: {
        A: "Resistance → Alarm → Exhaustion",
        B: "Alarm → Resistance → Exhaustion",
        C: "Appraisal → Resistance → Recovery",
        D: "Exhaustion → Alarm → Adaptation"
      },
      answer: "B",
      explanation: "Selye's GAS consists of three sequential phases: 1) Alarm reaction, 2) Stage of Resistance, and 3) Stage of Exhaustion.",
      topic: "General Adaptation Syndrome"
    },
    {
      id: "w2-q2",
      week: 2,
      question: "In Lazarus and Folkman's Transactional Model, Primary Appraisal involves evaluating:",
      options: {
        A: "Whether one has adequate coping resources to handle the situation",
        B: "Whether a situation is irrelevant, benign-positive, or stressful (harm/threat/challenge)",
        C: "The financial cost of managing the stressor",
        D: "The physiological heart rate response to stress"
      },
      answer: "B",
      explanation: "Primary Appraisal assesses the significance of an event: whether it poses a threat, harm, or challenge to the individual.",
      topic: "Transactional Model"
    },
    {
      id: "w2-q3",
      week: 2,
      question: "Secondary Appraisal focuses primarily on determining:",
      options: {
        A: "What options and coping resources are available to handle the stressor",
        B: "If the stressor originated from an internal or external source",
        C: "How long the alarm stage will last",
        D: "The genetics of the stress response"
      },
      answer: "A",
      explanation: "Secondary Appraisal evaluates available personal and social coping resources and options to manage the perceived stressor.",
      topic: "Transactional Model"
    },
    {
      id: "w2-q4",
      week: 2,
      question: "During which stage of Selye's GAS do bodily resources become depleted if chronic stress persists unabated?",
      options: {
        A: "Alarm Reaction Stage",
        B: "Stage of Resistance",
        C: "Stage of Exhaustion",
        D: "Cognitive Reappraisal Stage"
      },
      answer: "C",
      explanation: "In the Exhaustion stage, physiological reserves are drained, leaving the body vulnerable to illness and burnout.",
      topic: "General Adaptation Syndrome"
    },
    {
      id: "w2-q5",
      week: 2,
      question: "Reappraisal in the Lazarus & Folkman stress model refers to:",
      options: {
        A: "Modifying the original assessment based on new information or coping attempts",
        B: "Ignoring the stressor until it disappears",
        C: "Simulating physiological arousal artificially",
        D: "Categorizing stressors by environmental intensity"
      },
      answer: "A",
      explanation: "Reappraisal involves updating one's cognitive appraisal of the situation as conditions change or coping efforts unfold.",
      topic: "Cognitive Appraisal"
    }
  ]
};

export default week2Data;
