import { QuizGeneratorModal } from './QuizGeneratorModal';

interface QuizSectionBuilderProps {
  section: QuizSection;
  questions: Question[];
  tagSystem: TagSystem;
  usedQuestions: Set<string>;
  onChange: (section: QuizSection) => void;
  onDelete: () => void;
}

export const QuizSectionBuilder: React.FC<QuizSectionBuilderProps> = ({
  section,
  questions,
  tagSystem,
  usedQuestions,
  onChange,
  onDelete,
}) => {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  return (
    <div className="border rounded-lg p-4 mb-4">
      {/* Existing section builder UI */}
      
      {/* Add this button where appropriate in your UI */}
      <button
        onClick={() => setIsGeneratorOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        Auto Generate
      </button>

      <QuizGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        questions={questions}
        tagSystem={tagSystem}
        usedQuestions={usedQuestions}
        onGenerate={(sections) => {
          if (sections.length > 0) {
            onChange({
              ...section,
              ...sections[0], // Take the first section from the generator
              id: section.id, // Preserve the original section ID
            });
          }
        }}
      />
      
      {/* ... rest of your existing JSX ... */}
    </div>
  );
}; 