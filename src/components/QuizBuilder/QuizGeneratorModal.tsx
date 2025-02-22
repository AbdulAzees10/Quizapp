import React from 'react';
import { Question, TagSystem, QuizSection } from '../../types';
import { QuizGeneratorWizard } from './QuizGeneratorWizard';

interface QuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  tagSystem: TagSystem;
  usedQuestions: Set<string>;
  onGenerate: (sections: QuizSection[]) => void;
}

export const QuizGeneratorModal: React.FC<QuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  questions,
  tagSystem,
  usedQuestions,
  onGenerate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div className="relative bg-white rounded-lg w-full max-w-4xl">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Auto Generate Quiz</h2>
            <QuizGeneratorWizard
              questions={questions}
              tagSystem={tagSystem}
              usedQuestions={usedQuestions}
              onGenerate={(sections) => {
                onGenerate(sections);
                onClose();
              }}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 