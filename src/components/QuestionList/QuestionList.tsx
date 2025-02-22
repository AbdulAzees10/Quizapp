import React, { useState, useMemo, useEffect } from "react";
import { Question, Tags, TagSystem, Quiz } from "../../types";
import { TagSelector } from "../TagSelector/TagSelector";
import { PaginationControls } from "../PaginationControls/PaginationControls";
import { exportQuestions } from "../../utils/export";
import katex from "katex";

interface QuestionListProps {
  questions: Question[];
  tagSystem: TagSystem;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  quizzes: Quiz[];
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  tagSystem,
  onEditQuestion,
  onDeleteQuestion,
  quizzes,
}) => {
  const [filters, setFilters] = useState<Partial<Tags>>({});
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(() => {
    const saved = localStorage.getItem("questionsPerPage");
    return saved ? parseInt(saved, 10) : 10;
  });

  // Save questionsPerPage preference to localStorage
  useEffect(() => {
    localStorage.setItem("questionsPerPage", questionsPerPage.toString());
  }, [questionsPerPage]);

  // Reset to first page when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

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
          return (
            <span key={index} className="text-red-500">
              {part}
            </span>
          );
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
          return (
            <span key={index} className="text-red-500">
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
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
  }, [questions, filters, searchQuery]);

  // Calculate pagination
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleFilterChange = (newTags: Tags) => {
    setFilters(newTags);
  };

  const renderTags = (tags: Tags, question: Question) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(tags).map(
        ([key, value]) =>
          value && (
            <span
              key={key}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {key.replace("_", " ")}: {value}
            </span>
          )
      )}
      {question.usedInQuizzes && question.usedInQuizzes.length > 0 && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Used in:{" "}
          {question.usedInQuizzes
            .map((quizId) => {
              const quiz = quizzes.find((q) => q.id === quizId);
              return quiz?.title;
            })
            .filter(Boolean)
            .join(", ")}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Search and Export */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => {
                const blob = exportQuestions(filteredQuestions, "csv");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "questions.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                const blob = exportQuestions(filteredQuestions, "json");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "questions.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export JSON
            </button>
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Filter Questions
        </h3>
        <TagSelector
          tags={filters as Tags}
          tagSystem={tagSystem}
          onChange={handleFilterChange}
          onNewTag={() => {}} // Filter view doesn't need to create new tags
          onNewHierarchicalTag={() => {}} // Filter view doesn't need to create new tags
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {/* Pagination Controls */}
        {filteredQuestions.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredQuestions.length}
            itemsPerPage={questionsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setQuestionsPerPage(value);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Questions */}
        {currentQuestions.map((question) => (
          <div key={question.id} className="bg-white shadow-sm rounded-lg p-6">
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
                {renderTags(question.tags, question)}
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEditQuestion(question)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>

            <button
              onClick={() =>
                setExpandedQuestionId(
                  expandedQuestionId === question.id ? null : question.id
                )
              }
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedQuestionId === question.id
                ? "Hide Details"
                : "Show Details"}
            </button>

            {expandedQuestionId === question.id && (
              <div className="mt-4 space-y-4">
                {question.tags.question_type !== "Numeric" && (
                  <div className="grid grid-cols-2 gap-4">
                    {["A", "B", "C", "D"].map((letter) => {
                      const option =
                        `option_${letter.toLowerCase()}` as keyof Question;
                      const imageUrl = `${option}_image_url` as keyof Question;
                      return (
                        <div key={letter}>
                          <span className="label">Option {letter}:</span>
                          <div className="mt-1">
                            {renderMathContent(question[option] as string)}
                            {question[imageUrl] && (
                              <img
                                src={question[imageUrl] as string}
                                alt={`Option ${letter} image`}
                                className="mt-2 max-h-40 rounded-md"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <span className="label">Correct Answer:</span>
                  <div className="mt-1">
                    {Array.isArray(question.correct_answer)
                      ? question.correct_answer.join(", ")
                      : question.correct_answer}
                  </div>
                </div>

                <div>
                  <span className="label">Explanation:</span>
                  <div className="mt-1 prose max-w-none">
                    {renderMathContent(question.explanation)}
                    {question.explanation_image_url && (
                      <img
                        src={question.explanation_image_url}
                        alt="Explanation image"
                        className="mt-2 max-h-40 rounded-md"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
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
    </div>
  );
};
