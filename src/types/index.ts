export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'MCQ' | 'MMCQ' | 'Numeric';

export interface TagSystem {
  exam_types: string[];
  subjects: Record<string, string[]>;
  chapters: Record<string, string[]>;
  topics: Record<string, string[]>;
  difficulty_levels: DifficultyLevel[];
  question_types: QuestionType[];
  sources: string[];
  Quizused:boolean
}

export interface QuestionTags {
  exam_type: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty_level: DifficultyLevel;
  question_type: QuestionType;
  source?: string;
}

export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answers: string[];
  explanation?: string;
  tags: QuestionTags;
  createdAt: string;
  updatedAt: string;
  usedInQuizzes?: string[];
}

export interface TopicDistribution {
  topic: string;
  count: number;
}

export interface ChapterDistribution {
  chapter: string;
  count: number;
  topics: TopicDistribution[];
}

export interface AutoGenerateSettings {
  count: number;
  tags: Partial<QuestionTags>;
  difficulty: DifficultyLevel[];
  types: QuestionType[];
  subject?: string;
  chapterDistribution?: ChapterDistribution[];
}

export interface QuizSection {
  id: string;
  name: string;
  instructions?: string[];
  duration?: number;
  timerEnabled: boolean;
  marks: number;
  negativeMarks: number;
  questions: Question[];
  autoGenerate?: AutoGenerateSettings;
}

export interface Quiz {
  id: string;
  title: string;
  instructions?: string[];
  sections: QuizSection[];
  totalDuration: number;
  totalMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizGeneratorSettings {
  examType: string;
  sections: {
    id: string;
    subject: string;
    questionCount: number;
    difficultyDistribution: Record<DifficultyLevel, number>;
    typeDistribution: Record<QuestionType, number>;
    chapterDistribution: ChapterDistribution[];
  }[];
}

export interface QuizDistribution {
  totalDuration: number;
  totalMarks: number;
  sections: number;
  difficultyDistribution?: Record<DifficultyLevel, number>;
  typeDistribution?: Record<QuestionType, number>;
  chapterDistribution?: ChapterDistribution[];
}
