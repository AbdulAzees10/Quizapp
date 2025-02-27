import React, { useState, useMemo, useEffect } from "react";
import { Question, Tags, TagSystem, Quiz } from "../../types";
import { TagSelector } from "../TagSelector/TagSelector";
import { PaginationControls } from "../PaginationControls/PaginationControls";
import katex from "katex";
import { ReplaceQuestionModal } from "./ReplaceQuestionModal";
import { useDispatch, useSelector } from 'react-redux';
import { unselectQuestion } from '../../store/questionsSlice';



interface QuizSelectorProps {
  questions: Question[];
  tagSystem: TagSystem;
  selectedQuestions: Question[];
  onSelect: (questions: Question[]) => void;
  maxSelect?: number;
  quizzes: Quiz[];
  onReplace: (questionId: string, newQuestionId: string) => void;
}



const QuizSelector: React.FC<QuizSelectorProps> = ({
  questions,
  tagSystem,
  selectedQuestions,
  onSelect,
  maxSelect,
  quizzes,
}) => {
  const dispatch = useDispatch();
  const selectedQuestions = useSelector((state: any) => state.questions.selectedQuestions);

  const handleQuestionToggle = (questionId: string) => {
    dispatch(unselectQuestion(questionId)); // Unselect the question using Redux
  };

  const [filters, setFilters] = useState<Partial<Tags>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(() => {
    const saved = localStorage.getItem("questionsPerPage");
    return saved ? parseInt(saved, 10) : 10;
  });
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replacingQuestionId, setReplacingQuestionId] = useState<string | null>(
    null
  );
   
  // Save questionsPerPage preference to localStorage
  useEffect(() => {
    localStorage.setItem("questionsPerPage", questionsPerPage.toString());
  }, [questionsPerPage]);

  // Reset to first page when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  // Filter and search questions
  const filteredQuestions = useMemo(() => {
    return questions?.filter((question) => {
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

  // const handleQuestionToggle = (question: Question) => {
  //   console.log("Unselecting question:", question);
  //   const index = selectedQuestions.findIndex((q) => q.id === question.id);
    
  //   if (index !== -1) {
  //     selectedQuestions.splice(index, 1); // Remove the selected question
  //     onSelect([...selectedQuestions]); // Update the selection in the parent
  //   }
  // };

  const handleReplaceQuestion = (newQuestionId: string) => {
    const newSelectedQuestions = selectedQuestions.map((q) =>
      q.id === replacingQuestionId
        ? questions.find((question) => question.id === newQuestionId)!
        : q
    );
    onSelect(newSelectedQuestions);
    setReplacingQuestionId(null);
    setIsReplaceModalOpen(false);
  };

  const getQuizUsage = (questionId: string) => {
    return quizzes?.filter((quiz) =>
      quiz.sections?.some((section) =>
        section.questions?.some((q) => q.id === questionId)
      )
    );
  };

  const isQuestionUsedInQuiz = (questionId: string) => {
    return quizzes?.some((quiz) =>
      quiz.sections?.some((section) =>
        section.questions?.some((q) => q.id === questionId)
      )
    );
  };

  const renderTags = (tags: Tags, question: Question) => {
    const usedInQuizzes = getQuizUsage(question.id);

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {Object?.entries(tags)?.map(
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
        {usedInQuizzes?.length > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Used in: {usedInQuizzes.map((quiz) => quiz.title).join(", ")}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {/* <div className="space-y-4">
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
      </div> */}

      {/* Selected Count */}
      <div className="text-sm text-gray-600">
        Selected {selectedQuestions.length} questions
        {maxSelect && ` (max ${maxSelect})`}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {/* Pagination Controls */}
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
       

        {/* Questions */}
        {filteredQuestions
          .filter((question) => selectedQuestions.some((q) => q.id === question.id))
          .slice(
            (currentPage - 1) * questionsPerPage,
            currentPage * questionsPerPage
          )
          .map((question) => {
            const isSelected = selectedQuestions.some(
              (q) => q.id === question.id
            );
            return (
              <div
                key={question.id}
                className={`bg-white shadow-sm rounded-lg p-6 border-2 ${
                  isSelected ? "border-blue-500" : "border-transparent"
                }`}
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
                    {renderTags(question.tags, question)}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleQuestionToggle(question.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200`}
                    >
                      Unselect
                    </button>
                    {/* Replace Button */}
                    {isSelected && (
                      <button
                        onClick={() => {
                          setReplacingQuestionId(question.id);
                          setIsReplaceModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        Replace
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setExpandedQuestionId(
                          expandedQuestionId === question.id
                            ? null
                            : question.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedQuestionId === question.id
                        ? "Hide Details"
                        : "Show Details"}
                    </button>
                  </div>
                </div>

                {isSelected && expandedQuestionId === question.id && (
                  <div className="mt-4 space-y-4">
                    {question.tags.question_type !== "Numeric" && (
                      <div className="grid grid-cols-2 gap-4">
                        {["A", "B", "C", "D"].map((letter) => {
                          const option =
                            `option_${letter.toLowerCase()}` as keyof Question;
                          const imageUrl =
                            `${option}_image_url` as keyof Question;
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
            );
          })}

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
      {/* Replace Modal */}
      <ReplaceQuestionModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        questions={questions}
        tagSystem={tagSystem}
        quizzes={quizzes}
        onReplace={handleReplaceQuestion}
      />
    </div>
  );
};

export default QuizSelector;
