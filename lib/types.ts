export type ExerciseType =
  | 'write' | 'fix' | 'fill' | 'mcq'
  | 'multiple_choice' | 'true_false' | 'fill_blank' | 'predict_output' | 'code_exercise';

export type MatchType = 'exact' | 'contains' | 'startsWith' | 'runs';

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  description: string;
  hints: string[];
  starterCode?: string;
  expectedOutput?: string;
  matchType?: MatchType;
  matchPattern?: string;
  solutionCode?: string;
  question?: string;
  options?: string[];
  correctOption?: number;
  correctAnswer?: boolean;
  explanation?: string;
  codeTemplate?: string;
  blanks?: Array<{ id: string; answer: string }>;
  code?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  languageId: number;
  units: Unit[];
}

export interface ExecuteResult {
  status: string;
  statusId: number;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;
}

export interface ExerciseProgress {
  completed: boolean;
  viewedSolution: boolean;
}

export type CourseProgress = Record<string, ExerciseProgress>;
