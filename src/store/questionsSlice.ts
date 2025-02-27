// src/store/questionsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Question } from '../types/index';

interface QuestionsState {
  questions: Question[];
  selectedQuestions: Question[];
}

const initialState: QuestionsState = {
  questions: [],
  selectedQuestions: [],
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setQuestions(state, action: PayloadAction<Question[]>) {
      state.questions = action.payload;
    },
    addQuestion(state, action: PayloadAction<Question>) {
      state.questions.push(action.payload);
    },
    updateQuestion(state, action: PayloadAction<Question>) {
      const index = state.questions.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = action.payload;
      }
    },
    deleteQuestion(state, action: PayloadAction<string>) {
      state.questions = state.questions.filter(q => q.id !== action.payload);
    },
    selectQuestion(state, action: PayloadAction<Question>) {
      if (!state.selectedQuestions.some(q => q.id === action.payload.id)) {
        state.selectedQuestions.push(action.payload);
      }
    },
    unselectQuestion(state, action: PayloadAction<string>) {
      state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload);
    },
  },
});

export const {
  setQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  selectQuestion,
  unselectQuestion,
} = questionsSlice.actions;

export default questionsSlice.reducer;