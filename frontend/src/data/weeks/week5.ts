import { WeekData } from '../../types/quiz';

/**
 * ============================================================================
 * SAMPLE DEVELOPMENT DATA ONLY
 * ----------------------------------------------------------------------------
 * Replace the contents of this file with your actual NPTEL course questions.
 * The UI will dynamically adjust to the number of questions added here.
 * ============================================================================
 */
export const week5Data: WeekData = {
  week: 5,
  title: "Psychoneuroimmunology, Personality & Well-Being",
  description: "Mind-body connections in Psychoneuroimmunology (PNI), Type A/B/C/D personality traits, Mindfulness interventions, and Positive Psychology.",
  questions: [
    {
      id: "w5-q1",
      week: 5,
      question: "Psychoneuroimmunology (PNI) is an interdisciplinary field investigating interactions between:",
      options: {
        A: "Cardiovascular health, nutrition, and exercise physiology",
        B: "Psychological processes, the nervous system, and the immune system",
        C: "Genetics, sleep architecture, and dream content",
        D: "Cognitive development, social status, and academic test scores"
      },
      answer: "B",
      explanation: "PNI studies the bidirectional communication between psychological states, the central nervous system, and immune function.",
      topic: "Psychoneuroimmunology"
    },
    {
      id: "w5-q2",
      week: 5,
      question: "Which specific component of the Type A Personality pattern is most strongly linked to coronary heart disease risk?",
      options: {
        A: "High ambition and achievement striving",
        B: "Hostility and cynicism",
        C: "Time urgency and fast speech pace",
        D: "Preference for working independently"
      },
      answer: "B",
      explanation: "Research consistently highlights chronic hostility and cynical distrust as the toxic core of Type A behavior linked to cardiovascular strain.",
      topic: "Personality & Health"
    },
    {
      id: "w5-q3",
      week: 5,
      question: "Type D Personality is characterized by high levels of:",
      options: {
        A: "Extraversion and optimism",
        B: "Negative Affectivity and Social Inhibition",
        C: "Creativity and openness to experience",
        D: "Narcissism and dominance"
      },
      answer: "B",
      explanation: "Type D ('Distressed') personality involves a tendency to experience negative emotions combined with suppressing these emotions in social contexts.",
      topic: "Personality & Health"
    },
    {
      id: "w5-q4",
      week: 5,
      question: "Mindfulness-Based Stress Reduction (MBSR), developed by Jon Kabat-Zinn, emphasizes:",
      options: {
        A: "Paying attention in a particular way: on purpose, in the present moment, and non-judgmentally",
        B: "Suppressing negative thoughts using intense cognitive distraction",
        C: "Relying strictly on pharmacological interventions for anxiety",
        D: "Analyzing childhood memories to uncover hidden trauma"
      },
      answer: "A",
      explanation: "Kabat-Zinn defines mindfulness as purposeful, present-moment, non-judgmental awareness of experience.",
      topic: "Mindfulness & Interventions"
    },
    {
      id: "w5-q5",
      week: 5,
      question: "Subjective Well-Being (SWB) in psychology is typically measured by evaluating:",
      options: {
        A: "Gross domestic product and regional income levels",
        B: "Life satisfaction, high positive affect, and low negative affect",
        C: "Somatic reflexes and resting pulse rate",
        D: "Subconscious dream interpretation"
      },
      answer: "B",
      explanation: "SWB encompasses cognitive evaluations of life satisfaction along with emotional balance (frequency of positive vs negative emotions).",
      topic: "Well-Being & Positive Psychology"
    }
  ]
};

export default week5Data;
