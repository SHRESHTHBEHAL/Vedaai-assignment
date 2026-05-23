// ── Core Enums ──────────────────────────────────────────────
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "true_false"
  | "fill_in_the_blank"
  | "diagram"
  | "graph";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// ── Question Configuration (single section row) ─────────────
export interface QuestionConfig {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
  difficulty: Difficulty;
}

// ── Assignment Input (what the teacher fills in) ────────────
export interface AssignmentInput {
  title: string;
  subject: string;
  grade: string;
  topic: string;
  dueDate: string;
  instructions: string;
  questionConfigs: QuestionConfig[];
  fileContent?: string;
  fileName?: string;
}

// ── A single Question ──────────────────────────────────────
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

// ── Section of the paper ───────────────────────────────────
export interface Section {
  id: string;
  label: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: Question[];
}

// ── Complete Generated Paper ───────────────────────────────
export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  dueDate: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  generatedAt: string;
}

// ── Assignment entity (DB record) ──────────────────────────
export interface Assignment {
  id: string;
  input: AssignmentInput;
  status: JobStatus;
  jobId?: string;
  paper?: GeneratedPaper;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── WebSocket message envelope ─────────────────────────────
export interface WebSocketMessage {
  type: "JOB_STATUS" | "JOB_PROGRESS" | "JOB_COMPLETE" | "JOB_ERROR";
  assignmentId: string;
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  paper?: GeneratedPaper;
  error?: string;
}

// ── API response shapes ────────────────────────────────────
export interface CreateAssignmentResponse {
  assignmentId: string;
  jobId: string;
  message: string;
}

export interface APIError {
  error: string;
  details?: string;
}

// ── Legacy aliases (kept for gradual migration) ────────────
/** @deprecated Use Assignment instead */
export type AssignmentRecord = Assignment;
/** @deprecated Use Section instead */
export type QuestionSection = Section;
/** @deprecated Use JobStatus instead */
export type GenerationStatus = JobStatus;
/** @deprecated Use WebSocketMessage instead */
export type GenerationEvent = WebSocketMessage;
