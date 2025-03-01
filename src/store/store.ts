// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import questionsReducer from './questionsSlice';

const store = configureStore({
  reducer: {
    questions: questionsReducer,
  },
});

export default store;