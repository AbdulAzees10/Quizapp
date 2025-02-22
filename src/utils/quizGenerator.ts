import { Question, QuestionTags, DifficultyLevel, QuestionType, ChapterDistribution } from '../types';

interface GenerateOptions {
  count: number;
  questions: Question[];
  tags?: Partial<QuestionTags>;
  difficulty?: DifficultyLevel[];
  types?: QuestionType[];
  subject?: string;
  chapterDistribution?: ChapterDistribution[];
}

// Helper to get questions for a specific chapter and topic
function getQuestionsForChapterAndTopic(
  questions: Question[],
  subject: string,
  chapter: string,
  topic?: string
): Question[] {
  return questions.filter(q => 
    q.tags.subject === subject && 
    q.tags.chapter === chapter && 
    (!topic || q.tags.topic === topic)
  );
}

interface QuizDistribution {
  totalDuration: number;
  totalMarks: number;
  sections: number;
  difficultyDistribution?: {
    Easy?: number;
    Medium?: number;
    Hard?: number;
  };
  typeDistribution?: {
    MCQ?: number;
    MMCQ?: number;
    Numeric?: number;
  };
}

// Filter questions based on tags, difficulty, and type
function filterQuestions(
  questions: Question[],
  tags?: Partial<QuestionTags>,
  difficulty?: DifficultyLevel[],
  types?: QuestionType[]
): Question[] {
  return questions.filter(question => {
    // Check tags match
    if (tags) {
      const matchesTags = Object.entries(tags).every(([key, value]) => {
        if (!value) return true;
        return question.tags[key as keyof QuestionTags] === value;
      });
      if (!matchesTags) return false;
    }

    // Check difficulty matches
    if (difficulty && difficulty.length > 0) {
      if (!difficulty.includes(question.tags.difficulty_level)) {
        return false;
      }
    }

    // Check type matches
    if (types && types.length > 0) {
      if (!types.includes(question.tags.question_type)) {
        return false;
      }
    }

    return true;
  });
}

// Generate questions for a single section
export function generateSectionQuestions({
  count,
  questions,
  tags,
  difficulty,
  types,
  subject,
  chapterDistribution
}: GenerateOptions): Question[] {
  let selectedQuestions: Question[] = [];

  // If chapter distribution is specified, use it
  if (subject && chapterDistribution) {
    // First filter by difficulty and type if specified
    let availableQuestions = filterQuestions(questions, undefined, difficulty, types);

    // Then select questions according to chapter distribution
    for (const chapter of chapterDistribution) {
      const chapterQuestions = getQuestionsForChapterAndTopic(availableQuestions, subject, chapter.chapter);
      
      if (chapter.topics && chapter.topics.length > 0) {
        // Select questions by topic distribution
        for (const topic of chapter.topics) {
          const topicQuestions = getQuestionsForChapterAndTopic(chapterQuestions, subject, chapter.chapter, topic.topic);
          const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
          selectedQuestions.push(...shuffled.slice(0, topic.count));
        }
      } else {
        // Select questions from chapter without topic distribution
        const shuffled = [...chapterQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, chapter.count));
      }

      // Remove selected questions from available pool
      availableQuestions = availableQuestions.filter(q => !selectedQuestions.includes(q));
    }

    return selectedQuestions;
  }

  // If no chapter distribution, use original logic
  const filteredQuestions = filterQuestions(questions, tags, difficulty, types);

  // If not enough questions available, return all filtered questions
  if (filteredQuestions.length <= count) {
    return filteredQuestions;
  }

  // Shuffle and select required number of questions
  const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generate a balanced distribution of questions for a full quiz
export function generateFullQuiz(
  questions: Question[],
  distribution: QuizDistribution
): Question[][] {
  const { sections, difficultyDistribution, typeDistribution } = distribution;
  const questionsPerSection = Math.floor(questions.length / sections);
  const result: Question[][] = [];

  // Create sections
  for (let i = 0; i < sections; i++) {
    const sectionQuestions: Question[] = [];
    let remainingQuestions = [...questions];

    // Apply difficulty distribution if specified
    if (difficultyDistribution) {
      Object.entries(difficultyDistribution).forEach(([difficulty, percentage]) => {
        const count = Math.floor((questionsPerSection * (percentage || 0)) / 100);
        if (count > 0) {
          const difficultyQuestions = generateSectionQuestions({
            count,
            questions: remainingQuestions,
            difficulty: [difficulty as DifficultyLevel]
          });
          sectionQuestions.push(...difficultyQuestions);
          remainingQuestions = remainingQuestions.filter(
            q => !difficultyQuestions.includes(q)
          );
        }
      });
    }

    // Apply type distribution if specified
    if (typeDistribution) {
      Object.entries(typeDistribution).forEach(([type, percentage]) => {
        const count = Math.floor((questionsPerSection * (percentage || 0)) / 100);
        if (count > 0) {
          const typeQuestions = generateSectionQuestions({
            count,
            questions: remainingQuestions,
            types: [type as QuestionType]
          });
          sectionQuestions.push(...typeQuestions);
          remainingQuestions = remainingQuestions.filter(
            q => !typeQuestions.includes(q)
          );
        }
      });
    }

    // Fill remaining slots with random questions
    const remainingCount = questionsPerSection - sectionQuestions.length;
    if (remainingCount > 0) {
      const additionalQuestions = generateSectionQuestions({
        count: remainingCount,
        questions: remainingQuestions
      });
      sectionQuestions.push(...additionalQuestions);
    }

    result.push(sectionQuestions);
  }

  return result;
}

// Calculate default marks based on difficulty and type
export function calculateDefaultMarks(question: Question): number {
  let marks = 1;

  // Adjust based on difficulty
  switch (question.tags.difficulty_level) {
    case 'Easy':
      marks *= 1;
      break;
    case 'Medium':
      marks *= 2;
      break;
    case 'Hard':
      marks *= 3;
      break;
  }

  // Adjust based on type
  switch (question.tags.question_type) {
    case 'MCQ':
      marks *= 1;
      break;
    case 'MMCQ':
      marks *= 2;
      break;
    case 'Numeric':
      marks *= 1.5;
      break;
  }

  return marks;
}

// Calculate default negative marks based on marks
export function calculateDefaultNegativeMarks(marks: number): number {
  return marks * 0.25; // 25% negative marking by default
}
