import { createStore } from 'redux';

// Define the initial state
const initialState = {
  selectedQuestions: [],
};

// Define action types
const SET_SELECTED_QUESTIONS = 'SET_SELECTED_QUESTIONS';

// Define action creators
export const setSelectedQuestions = (questions) => ({
  type: SET_SELECTED_QUESTIONS,
  payload: questions,
});

// Define the reducer
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SELECTED_QUESTIONS:
      return {
        ...state,
        selectedQuestions: action.payload,
      };
    default:
      return state;
  }
};

// Create the store
const store = createStore(reducer);

export default store; 