import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Question, TagSystem, QuizSection } from '../../types';
import { QuizSectionBuilder } from '../QuizSectionBuilder/QuizSectionBuilder';
import { QuizGeneratorWizard } from './QuizGeneratorWizard';
import { QuizPreview } from '../QuizPreview/QuizPreview';
import { Modal } from './Modal';
import { toast } from 'react-hot-toast';

interface QuizBuilderProps {
  questions: Question[];
  tagSystem: TagSystem;
  onSave: (quiz: Quiz, updatedQuestions?: Question[]) => void;
  initialQuiz?: Quiz;
  quizzes: Quiz[];
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  questions,
  tagSystem,
  onSave,
  initialQuiz,
  quizzes,
}) => {
  // Helper to get used questions across all sections except the current section
  const getUsedQuestions = (currentSectionId: string) => {
    const usedQuestionIds = new Set<string>();
    
    // Get all questions used in other sections of this quiz
    quiz.sections.forEach(section => {
      if (section.id !== currentSectionId) {
        section.questions.forEach(question => {
          usedQuestionIds.add(question.id);
        });
      }
    });
    
    return usedQuestionIds;
  };

  // Filter available questions for the QuizSectionBuilder
  const getAvailableQuestions = (currentSectionId: string) => {
    const usedQuestions = getUsedQuestions(currentSectionId);
    // Return only questions that haven't been used in other sections
    return questions.filter(question => !usedQuestions.has(question.id));
  };

  const [quiz, setQuiz] = useState<Quiz>(() => initialQuiz || {
    id: crypto.randomUUID(),
    title: '',
    instructions: [],
    sections: [],
    totalDuration: 0,
    totalMarks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [newInstruction, setNewInstruction] = useState('');
  const [showGeneratorWizard, setShowGeneratorWizard] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate totals whenever sections change
  useEffect(() => {
    const totalMarks = quiz.sections.reduce(
      (sum, section) => sum + section.marks * section.questions.length,
      0
    );

    // Only update marks, not duration
    if (totalMarks !== quiz.totalMarks) {
      setQuiz(prev => ({
        ...prev,
        totalMarks,
        updatedAt: new Date().toISOString(),
      }));
    }
  }, [quiz.sections.map(section => ({
    marks: section.marks,
    questionCount: section.questions.length
  }))]);

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setQuiz(prev => ({
        ...prev,
        instructions: [...(prev.instructions || []), newInstruction.trim()],
      }));
      setNewInstruction('');
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setQuiz(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleGeneratedSections = (sections: QuizSection[]) => {
    setQuiz(prev => ({
      ...prev,
      sections: [...prev.sections, ...sections]
    }));
    setShowGeneratorWizard(false);
  };

  const handleSave = async () => {
    // Validate title
    if (!quiz.title || quiz.title.trim() === '') {
      toast.error('Please enter a quiz title');
      return;
    }

    // Validate sections
    if (quiz.sections.length === 0) {
      toast.error('Please add at least one section');
      return;
    }

    setIsSaving(true);
    try {
      const updatedQuiz = {
        ...quiz,
        updatedAt: new Date().toISOString()
      };

      // Update questions to track quiz usage
      const updatedQuestions = questions.map(q => {
        const isUsedInThisQuiz = quiz.sections.some(section =>
          section.questions.some(sq => sq.id === q.id)
        );

        if (isUsedInThisQuiz) {
          const usedInQuizzes = new Set(q.usedInQuizzes || []);
          usedInQuizzes.add(quiz.id);
          return {
            ...q,
            usedInQuizzes: Array.from(usedInQuizzes)
          };
        }
        return q;
      });

      await onSave(updatedQuiz, updatedQuestions);
      toast.success('Quiz saved successfully!');
    } catch (error) {
      toast.error('Failed to save quiz');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Quiz Title
          </label>
          <input
            type="text"
            id="title"
            value={quiz.title}
            onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Total Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={quiz.totalDuration}
            onChange={(e) => setQuiz(prev => ({ 
              ...prev, 
              totalDuration: parseInt(e.target.value) || 0 
            }))}
            min="0"
            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions (Optional)
          </label>
          <div className="space-y-2">
            {quiz.instructions?.map((instruction, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm">{index + 1}.</span>
                <span className="flex-1">{instruction}</span>
                <button
                  onClick={() => handleRemoveInstruction(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                placeholder="Add an instruction..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInstruction();
                  }
                }}
              />
              <button
                onClick={handleAddInstruction}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Sections</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGeneratorWizard(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Auto Generate
              </button>
              <button
                onClick={() =>
                  setQuiz(prev => ({
                    ...prev,
                    sections: [
                      ...prev.sections,
                      {
                        id: crypto.randomUUID(),
                        name: `Section ${prev.sections.length + 1}`,
                        timerEnabled: false,
                        marks: 1,
                        negativeMarks: 0,
                        questions: [],
                      },
                    ],
                  }))
                }
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                Add Section
              </button>
            </div>
          </div>

          {quiz.sections.map((section, index) => (
            <QuizSectionBuilder
              key={index}
              section={section}
              questions={getAvailableQuestions(section.id)}
              tagSystem={tagSystem}
              usedQuestions={new Set<string>()}
              quizzes={quizzes}
              onChange={(updatedSection) =>
                setQuiz(prev => ({
                  ...prev,
                  sections: prev.sections.map((s) =>
                    s.id === updatedSection.id ? updatedSection : s
                  ),
                }))
              }
              onDelete={() =>
                setQuiz(prev => ({
                  ...prev,
                  sections: prev.sections.filter((s) => s.id !== section.id),
                }))
              }
            />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
          <div className="text-sm text-gray-600">
            <div>Total Duration: {quiz.totalDuration} minutes</div>
            <div>Total Marks: {quiz.totalMarks}</div>
            <div>
              Total Questions:{' '}
              {quiz.sections.reduce((sum, section) => sum + section.questions.length, 0)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-white text-sm font-medium rounded-md ${
              isSaving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>

      {/* Quiz Generator Wizard Modal */}
      {showGeneratorWizard && (
        <Modal onClose={() => setShowGeneratorWizard(false)}>
          <QuizGeneratorWizard
            questions={questions}
            tagSystem={tagSystem}
            onGenerate={handleGeneratedSections}
            onCancel={() => setShowGeneratorWizard(false)}
            usedQuestions={getUsedQuestions('')}
          />
        </Modal>
      )}

      {/* Quiz Preview Modal */}
      {showPreview && (
        <QuizPreview
          quiz={quiz}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
