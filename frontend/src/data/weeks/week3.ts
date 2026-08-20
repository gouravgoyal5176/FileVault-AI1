import { WeekData } from '../../types/quiz';

/**
 * ============================================================================
 * SAMPLE DEVELOPMENT DATA ONLY
 * ----------------------------------------------------------------------------
 * Replace the contents of this file with your actual NPTEL course questions.
 * The UI will dynamically adjust to the number of questions added here.
 * ============================================================================
 */
export const week3Data: WeekData = {
  week: 3,
  title: "Physiological Axis & Endocrine Pathways",
  description: "Detailed study of the HPA (Hypothalamic-Pituitary-Adrenal) axis, Cortisol secretion, and Neuroendocrine responses.",
  questions: [
    {
      id: "w3-q1",
      week: 3,
      question: "Which brain structure acts as the primary control center for triggering the HPA Axis during perceived stress?",
      options: {
        A: "Cerebellum",
        B: "Hypothalamus",
        C: "Occipital Lobe",
        D: "Medulla Oblongata"
      },
      answer: "B",
      explanation: "The Hypothalamus secretes Corticotropin-Releasing Hormone (CRH), initiating the HPA Axis cascade during stress.",
      topic: "HPA Axis"
    },
    {
      id: "w3-q2",
      week: 3,
      question: "Cortisol is commonly referred to as the primary:",
      options: {
        A: "Growth hormone",
        B: "Stress hormone",
        C: "Thyroid regulating hormone",
        D: "Digestive enzyme"
      },
      answer: "B",
      explanation: "Cortisol, produced by the adrenal cortex, regulates glucose metabolism, inflammation, and immune responses during sustained stress.",
      topic: "Endocrine System"
    },
    {
      id: "w3-q3",
      week: 3,
      question: "Adrenocorticotropic Hormone (ACTH) is secreted by which endocrine gland in the HPA Axis pathway?",
      options: {
        A: "Anterior Pituitary Gland",
        B: "Adrenal Cortex",
        C: "Thyroid Gland",
        D: "Pancreas"
      },
      answer: "A",
      explanation: "The Anterior Pituitary Gland releases ACTH into the bloodstream in response to CRH from the hypothalamus.",
      topic: "HPA Axis Pathway"
    },
    {
      id: "w3-q4",
      week: 3,
      question: "What is Allostatic Load?",
      options: {
        A: "The cumulative biological wear and tear on the body caused by chronic stress exposure",
        B: "The maximum amount of physical weight a person can lift under adrenaline",
        C: "A cognitive strategy for prioritizing daily tasks",
        D: "The rate at which digestive enzymes break down lipids"
      },
      answer: "A",
      explanation: "McEwen defined Allostatic Load as the physiological cost of chronic exposure to fluctuating or heightened neural/neuroendocrine responses.",
      topic: "Allostasis & Physiology"
    },
    {
      id: "w3-q5",
      week: 3,
      question: "The Parasympathetic Nervous System promotes bodily recovery through which characteristic response?",
      options: {
        A: "Pupil dilation and accelerated respiration",
        B: "Rest and Digest response (lowering heart rate and stimulating digestion)",
        C: "Inhibition of insulin release and glycogenolysis",
        D: "Immediate release of norepinephrine from the sympathetic chain"
      },
      answer: "B",
      explanation: "The Parasympathetic system counteracts stress arousal by slowing heart rate and restoring digestive homeostasis.",
      topic: "Autonomic Nervous System"
    }
  ]
};

export default week3Data;
