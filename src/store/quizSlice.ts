import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Quiz, Question } from '../../src/types';

interface QuestionStatus {
  visited: boolean;
  answered: boolean;
  markedForReview: boolean;
  selectedAnswers: string[];
}

interface QuizState {
  currentSection: number;
  currentQuestion: number;
  timeRemaining: number;
  questionStatus: Record<string, QuestionStatus>;
  tempAnswers: Record<string, string[]>;
  view: 'instructions' | 'quiz';
  acceptedInstructions: boolean;
  isCompactView: boolean;
}

const initialState: QuizState = {
  currentSection: 0,
  currentQuestion: 0,
  timeRemaining: 0,
  questionStatus: {},
  tempAnswers: {},
  view: 'instructions',
  acceptedInstructions: false,
  isCompactView: false,
};

export const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setCurrentSection: (state, action: PayloadAction<number>) => {
      state.currentSection = action.payload;
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload;
    },
    updateQuestionStatus: (state, action: PayloadAction<{ questionId: string, status: Partial<QuestionStatus> }>) => {
      const { questionId, status } = action.payload;
      state.questionStatus[questionId] = {
        ...state.questionStatus[questionId],
        ...status,
      };
    },
    setTempAnswer: (state, action: PayloadAction<{ questionId: string, answers: string[] }>) => {
      const { questionId, answers } = action.payload;
      state.tempAnswers[questionId] = answers;
    },
    clearTempAnswer: (state, action: PayloadAction<string>) => {
      delete state.tempAnswers[action.payload];
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setView: (state, action: PayloadAction<'instructions' | 'quiz'>) => {
      state.view = action.payload;
    },
    setAcceptedInstructions: (state, action: PayloadAction<boolean>) => {
      state.acceptedInstructions = action.payload;
    },
    setIsCompactView: (state, action: PayloadAction<boolean>) => {
      state.isCompactView = action.payload;
    },
    initializeQuiz: (state, action: PayloadAction<Quiz>) => {
      const quiz = action.payload;
      state.timeRemaining = quiz.totalDuration * 60;
      
      // Initialize question status
      const initialStatus: Record<string, QuestionStatus> = {};
      quiz.sections.forEach(section => {
        section.questions.forEach(question => {
          initialStatus[question.id] = {
            visited: false,
            answered: false,
            markedForReview: false,
            selectedAnswers: []
          };
        });
      });
      state.questionStatus = initialStatus;
      state.tempAnswers = {};
    },
  },
});

export const {
  setCurrentSection,
  setCurrentQuestion,
  updateQuestionStatus,
  setTempAnswer,
  clearTempAnswer,
  setTimeRemaining,
  setView,
  setAcceptedInstructions,
  setIsCompactView,
  initializeQuiz,
} = quizSlice.actions;

export default quizSlice.reducer; 