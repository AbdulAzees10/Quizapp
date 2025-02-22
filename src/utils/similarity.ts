import stringSimilarity from 'string-similarity';
import { Question } from '../types';

export const findSimilarQuestions = (
  newQuestion: string,
  existingQuestions: Question[],
  threshold = 0.8
) => {
  // Just normalize whitespace and case, keeping LaTeX code for better comparison
  const normalizeText = (text: string) => 
    text
      .replace(/\s+/g, ' ')  // Normalize all whitespace to single space
      .trim()                // Remove leading/trailing whitespace
      .toLowerCase();        // Case-insensitive comparison

  const normalizedNewQuestion = normalizeText(newQuestion);
  
  return existingQuestions
    .map(q => {
      const similarity = stringSimilarity.compareTwoStrings(
        normalizedNewQuestion,
        normalizeText(q.question_text)
      );
      return {
        question: q,
        similarity,
        matchedText: q.question_text
      };
    })
    .filter(result => result.similarity > threshold)
    .sort((a, b) => b.similarity - a.similarity);
};
