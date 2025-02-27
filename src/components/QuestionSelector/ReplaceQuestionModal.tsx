import React from "react";
import { Question, Tags, TagSystem, Quiz } from "../../types";
import katex from "katex";
import { TagSelector } from "../TagSelector/TagSelector";

interface ReplaceQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  tagSystem: TagSystem;
  quizzes: Quiz[];
  onReplace: (newQuestionId: string) => void;
}

export const ReplaceQuestionModal: React.FC<ReplaceQuestionModalProps> = ({
  isOpen,
  onClose,
  questions,
  tagSystem,
  quizzes,
  onReplace,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState<Partial<Tags>>({});

  if (!isOpen) return null;

  // Filter questions based on search and tags
  const filteredQuestions = questions.filter((question) => {
    // Apply tag filters
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return question.tags[key as keyof Tags] === value;
    });

    if (!matchesFilters) return false;

    // Apply search filter
    if (!searchQuery) return true;

    const searchIn = [
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.explanation,
      Object.values(question.tags).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return searchIn.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Replace Question</h2>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />

          <TagSelector
            tags={filters as Tags}
            tagSystem={tagSystem}
            onChange={setFilters}
            onNewTag={() => {}}
            onNewHierarchicalTag={() => {}}
          />
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white shadow-sm rounded-lg p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="prose max-w-none">
                    {renderMathContent(question.question_text)}
                  </div>
                  {question.image_url && (
                    <img
                      src={question.image_url}
                      alt="Question"
                      className="mt-4 max-w-full h-auto rounded-lg"
                    />
                  )}
                </div>
                <button
                  onClick={() => {
                    onReplace(question.id);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Select
                </button>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">
                {searchQuery
                  ? "No questions found matching your search and filters."
                  : "No questions found matching the selected filters."}
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Helper function to render math content
const renderMathContent = (text: string) => {
  return text.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/).map((part, index) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      try {
        const math = part.slice(2, -2);
        return (
          <span
            key={index}
            className="block my-2"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: true }),
            }}
          />
        );
      } catch (error) {
        return <span key={index} className="text-red-500">{part}</span>;
      }
    } else if (part.startsWith("$") && part.endsWith("$")) {
      try {
        const math = part.slice(1, -1);
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(math, { displayMode: false }),
            }}
          />
        );
      } catch (error) {
        return <span key={index} className="text-red-500">{part}</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
};