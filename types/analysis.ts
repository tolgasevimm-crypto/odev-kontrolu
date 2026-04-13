import { SubjectType } from "./database";

export interface QuestionDetail {
  number: number;
  text: string;
  student_answer: string | null;
  correct_answer: string;
  status: "dogru" | "yanlis" | "cevaplanmamis";
  topic: string;
}

export interface SolutionDetail {
  question_number: number;
  steps: string[];
  explanation: string;
}

export interface ClaudeAnalysisResponse {
  detected_topic: string;
  questions: QuestionDetail[];
  strong_topics: string[];
  weak_topics: string[];
  solutions: SolutionDetail[];
  summary: string;
}

export interface AnalysisResult {
  detected_topic: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  score_percentage: number;
  strong_topics: string[];
  weak_topics: string[];
  questions_detail: QuestionDetail[];
  solutions: SolutionDetail[];
  summary: string;
}

export interface SubmissionWithAnalysis {
  id: string;
  child_id: string;
  child_name: string;
  subject: SubjectType;
  status: string;
  score_percentage: number | null;
  submitted_at: string;
  image_url: string;
  analysis: AnalysisResult | null;
}

export interface DashboardData {
  scoreOverTime: {
    date: string;
    subject: SubjectType;
    score: number;
  }[];
  topicPerformance: {
    topic: string;
    subject: SubjectType;
    attempts: number;
    correct: number;
    incorrect: number;
  }[];
  subjectSummary: {
    subject: SubjectType;
    average_score: number;
    total_submissions: number;
  }[];
}
