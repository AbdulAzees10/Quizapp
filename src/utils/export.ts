import { Question } from '../types';

export const exportQuestions = (questions: Question[], format: 'csv' | 'json') => {
  if (format === 'csv') {
    const headers = [
      'id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
      'correct_answer', 'explanation', 'image_url', 'option_a_image_url',
      'option_b_image_url', 'option_c_image_url', 'option_d_image_url',
      'explanation_image_url', 'exam_type', 'subject', 'chapter', 'topic',
      'difficulty_level', 'question_type', 'source'
    ];

    const rows = questions.map(q => [
      q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
      Array.isArray(q.correct_answer) ? q.correct_answer.join(';') : q.correct_answer,
      q.explanation, q.image_url || '', q.option_a_image_url || '',
      q.option_b_image_url || '', q.option_c_image_url || '',
      q.option_d_image_url || '', q.explanation_image_url || '',
      q.tags.exam_type, q.tags.subject, q.tags.chapter, q.tags.topic,
      q.tags.difficulty_level, q.tags.question_type, q.tags.source
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  return new Blob([JSON.stringify(questions, null, 2)], { 
    type: 'application/json' 
  });
};
