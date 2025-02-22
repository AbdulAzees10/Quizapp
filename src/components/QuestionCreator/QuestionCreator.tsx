import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Question, Tags, TagSystem } from '../../types';
import { findSimilarQuestions } from '../../utils/similarity';
import { TagSelector } from '../TagSelector/TagSelector';

interface QuestionCreatorProps {
  initialQuestion?: Question;
  questions: Question[];
  tagSystem: TagSystem;
  onSave: (question: Question) => void;
  onNewTag: (
    category: 'exam_types' | 'sources' | 'difficulty_levels' | 'question_types',
    value: string
  ) => void;
  onNewHierarchicalTag: (
    examType: string,
    subject: string,
    chapter: string,
    topic: string
  ) => void;
}

export const QuestionCreator: React.FC<QuestionCreatorProps> = ({
  initialQuestion,
  questions,
  tagSystem,
  onSave,
  onNewTag,
  onNewHierarchicalTag,
}) => {
  const [previewMode, setPreviewMode] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Question>({
    defaultValues: initialQuestion || {
      id: crypto.randomUUID(),
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '',
      explanation: '',
      image_url: '',
      option_a_image_url: '',
      option_b_image_url: '',
      option_c_image_url: '',
      option_d_image_url: '',
      explanation_image_url: '',
      tags: {
        exam_type: '',
        subject: '',
        chapter: '',
        topic: '',
        difficulty_level: 'Medium',
        question_type: 'MCQ',
        source: '',
      },
    },
  });

  const questionType = watch('tags.question_type');
  const currentTags = watch('tags');
  const [similarQuestions, setSimilarQuestions] = useState<Array<{
    question: Question;
    similarity: number;
    matchedText: string;
  }>>([]);

  const SIMILARITY_THRESHOLDS = {
    HIGH: 0.85,   // Almost identical questions
    MEDIUM: 0.70  // Very similar questions
  };

  // Check for similar questions when question text changes
  useEffect(() => {
    const questionText = watch('question_text');
    if (questionText.length > 10) { // Only check if enough text is entered
      const similar = findSimilarQuestions(
        questionText,
        questions.filter(q => q.id !== initialQuestion?.id), // Exclude current question when editing
        SIMILARITY_THRESHOLDS.MEDIUM // Show anything above medium similarity
      );
      setSimilarQuestions(similar);
    } else {
      setSimilarQuestions([]);
    }
  }, [watch('question_text'), questions, initialQuestion]);

  const handleTagChange = (newTags: Tags) => {
    setValue('tags', newTags);
  };

  const renderMathPreview = (text: string) => {
    return text.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/).map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        try {
          const math = part.slice(2, -2);
          return (
            <span key={index} className="block my-2" dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: true })
            }} />
          );
        } catch (error) {
          return <span key={index} className="text-red-500">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        try {
          const math = part.slice(1, -1);
          return (
            <span key={index} dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: false })
            }} />
          );
        } catch (error) {
          return <span key={index} className="text-red-500">{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const onSubmit = async (data: Question) => {
    if (similarQuestions.some(q => q.similarity > SIMILARITY_THRESHOLDS.HIGH)) {
      const proceed = window.confirm(
        'Warning: Nearly identical questions found. Are you sure you want to save this question?'
      );
      if (!proceed) return;
    } else if (similarQuestions.length > 0) {
      const proceed = window.confirm(
        'Similar questions found. Do you still want to save this question?'
      );
      if (!proceed) return;
    }

    if (questionType === 'MMCQ' && typeof data.correct_answer === 'string') {
      data.correct_answer = data.correct_answer.split(',').map(answer => answer.trim());
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <label className="label" htmlFor="question_text">Question Text</label>
          <div className="space-y-2">
            <textarea
              rows={6}
              id="question_text"
              {...register('question_text', { required: true })}
              className="input-field h-32 w-full px-4 border-2 border-gray-400 rounded-md"
              placeholder="Enter question text here... Use $...$ for inline math (e.g., $F = ma$) and $$...$$ for display math (e.g., $$E = mc^2$$)"
            />
            <input
              type="text"
              {...register('image_url')}
              className="input-field w-full px-4 border-2 border-gray-400 rounded-md"
              placeholder="Question Image URL (optional)"
            />
            {watch('image_url') && (
              <img
                src={watch('image_url')}
                alt="Question image"
                className="max-h-40 rounded-md"
              />
            )}
          </div>
          {previewMode && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              {renderMathPreview(watch('question_text'))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 "
          >
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
          {similarQuestions.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-yellow-800 font-medium">
                {similarQuestions.some(q => q.similarity > SIMILARITY_THRESHOLDS.HIGH)
                  ? "Warning: Nearly Identical Questions Found"
                  : "Similar Questions Found"}
              </h4>
              <div className="mt-2 space-y-4">
                {similarQuestions.map(({ question, similarity, matchedText }) => (
                  <div 
                    key={question.id} 
                    className={`text-sm p-3 rounded-md ${
                      similarity > SIMILARITY_THRESHOLDS.HIGH
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <p className={`font-medium ${
                      similarity > SIMILARITY_THRESHOLDS.HIGH
                        ? 'text-red-700'
                        : 'text-yellow-700'
                    }`}>
                      {similarity > SIMILARITY_THRESHOLDS.HIGH
                        ? `Warning: ${Math.round(similarity * 100)}% identical`
                        : `Similarity: ${Math.round(similarity * 100)}%`}
                    </p>
                    <p className={`mt-1 ${
                      similarity > SIMILARITY_THRESHOLDS.HIGH
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {matchedText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(questionType === 'MCQ' || questionType === 'MMCQ') && (
          <div className="grid grid-cols-1 gap-6">
            {['option_a', 'option_b', 'option_c', 'option_d'].map((option) => (
              <div key={option}>
                <label className="label" htmlFor={option}>Option {option.split('_')[1].toUpperCase()}</label>
                <div className="space-y-2 flex flex-col">
                  <textarea
                    rows={2}
                    id={option}
                    {...register(option as keyof Question, { required: true })}
                    className="input-field  px-4 border-2 border-gray-400 rounded-md"
                    placeholder={`Enter option ${option.split('_')[1].toUpperCase()}... Use $...$ for inline math and $$...$$ for display math`}
                  />
                  <input
                    type="text"
                    {...register(
                      option === 'option_a' ? 'option_a_image_url' :
                      option === 'option_b' ? 'option_b_image_url' :
                      option === 'option_c' ? 'option_c_image_url' :
                      'option_d_image_url'
                    )}
                    className="input-field  px-4 border-2 border-gray-400 rounded-md"
                    placeholder="Image URL (optional)"
                  />
                  {watch(
                    option === 'option_a' ? 'option_a_image_url' :
                    option === 'option_b' ? 'option_b_image_url' :
                    option === 'option_c' ? 'option_c_image_url' :
                    'option_d_image_url'
                  ) && (
                    <img
                      src={watch(
                        option === 'option_a' ? 'option_a_image_url' :
                        option === 'option_b' ? 'option_b_image_url' :
                        option === 'option_c' ? 'option_c_image_url' :
                        'option_d_image_url'
                      )}
                      alt={`Option ${option.split('_')[1].toUpperCase()} image`}
                      className="max-h-40 rounded-md"
                    />
                  )}
                  {previewMode && (
                    <div className="mt-2 p-2 border rounded-md bg-gray-50">
                      {renderMathPreview(watch(option as keyof Question) as string)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <label className="label" htmlFor="correct_answer">
            {questionType === 'Numeric' ? 'Numerical Answer' :
             questionType === 'MMCQ' ? 'Correct Answers (comma-separated)' :
             'Correct Answer'}
          </label>
          {questionType === 'Numeric' ? (
            <input
              type="number"
              step="any"
              {...register('correct_answer', { 
                required: true,
                valueAsNumber: true
              })}
              className="input-field"
              placeholder="Enter numerical value"
            />
          ) : questionType === 'MMCQ' ? (
            <input
              type="text"
              {...register('correct_answer', { required: true })}
              className="input-field"
              placeholder="e.g., A,B,D"
            />
          ) : (
            <select {...register('correct_answer', { required: true })} className="input-field">
              <option value="">Select correct option</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          )}
        </div>

        <div className="mt-6">
          <label className="label" htmlFor="explanation">Explanation</label>
          <div className="space-y-2 flex flex-col">
            <textarea
              rows={6}
              id="explanation"
              {...register('explanation', { required: true })}
              className="input-field h-32 w-full px-4 border-2 border-gray-400 rounded-md"
              placeholder="Enter explanation... Use $...$ for inline math (e.g., $F = ma$) and $$...$$ for display math (e.g., $$E = mc^2$$)"
            />
            <input
              type="text"
              {...register('explanation_image_url')}
              className="input-field w-full px-4 border-2 border-gray-400 rounded-md"
              placeholder="Explanation Image URL (optional)"
            />
            {watch('explanation_image_url') && (
              <img
                src={watch('explanation_image_url')}
                alt="Explanation image"
                className="max-h-40 rounded-md"
              />
            )}
            {previewMode && (
              <div className="mt-2 p-4 border rounded-md bg-gray-50">
                {renderMathPreview(watch('explanation'))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Tags</h3>
          <TagSelector
            tags={currentTags}
            tagSystem={tagSystem}
            onChange={handleTagChange}
            onNewTag={onNewTag}
            onNewHierarchicalTag={onNewHierarchicalTag}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
          Save Question
        </button>
      </div>
    </form>
  );
};
