export interface LessonProgress {
  currentPage: number;
  totalPages: number;
  timeSpent: number;
  lastAccessed: Date;
}

export interface GameProgress {
  level: number;
  points: number;
  achievements: string[];
  bestScore: number;
}

export interface ExamProgress {
  answers: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
  }[];
  timeSpent: number;
  attempts: number;
}
