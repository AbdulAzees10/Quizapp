import React from 'react';
import { Quiz } from '../../types';
import { QuizTaker } from '../QuizTaker/QuizTaker';
import { Modal } from '../QuizBuilder/Modal';

interface QuizPreviewProps {
  quiz: Quiz;
  onClose: () => void;
}

export function QuizPreview({ quiz, onClose }: QuizPreviewProps) {
  return (
    <Modal onClose={onClose}>
      <div className="min-h-[80vh] max-h-[80vh] overflow-y-auto">
        <QuizTaker
          quiz={quiz}
          onSubmit={() => {
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}
