import React, { useState, useEffect, useCallback, useRef } from "react";
import { Quiz, Question } from "../../types";
import { MathText } from "../MathText/MathText";
import Logo1 from "../../assets/img/Logo1.png";
import Logo2 from "../../assets/img/Logo2.png";
import Logo3 from "../../assets/img/Logo3.png";
import Logo4 from "../../assets/img/Logo4.png";
import Logo5 from "../../assets/img/Logo5.png";
import down from "../../assets/img/down.png";
import up from "../../assets/img/up.png";
import katex from "katex";

interface QuestionStatus {
  visited: boolean;
  answered: boolean;
  markedForReview: boolean;
  selectedAnswers: string[];
}

interface QuizTakerProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string[]>) => void;
}

export function QuizTaker({ quiz, onSubmit }: QuizTakerProps) {
  // View states
  const [view, setView] = useState<"instructions" | "quiz">("instructions");
  const [acceptedInstructions, setAcceptedInstructions] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);

  // Quiz state
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(quiz.totalDuration * 60);
  const [questionStatus, setQuestionStatus] = useState<
    Record<string, QuestionStatus>
  >({});
  const [tempAnswers, setTempAnswers] = useState<Record<string, string[]>>({});

  // Refs
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  // Scroll handlers
  const handleScroll = (direction: "up" | "down") => {
    if (!questionContainerRef.current) return;

    const container = questionContainerRef.current;
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const currentScroll = container.scrollTop;

    // Calculate scroll amount as percentage of visible container height
    const scrollPercentage = 0.33; // Scroll by 1/3 of the visible height
    const scrollAmount = Math.floor(containerHeight * scrollPercentage);

    let targetScroll;
    if (direction === "down") {
      targetScroll = Math.min(currentScroll + scrollAmount, scrollHeight - containerHeight);
    } else {
      targetScroll = Math.max(currentScroll - scrollAmount, 0);
    }

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  // Get continuous question number
  const getQuestionNumber = useCallback(
    (sectionIndex: number, questionIndex: number): number => {
      let number = questionIndex;
      for (let i = 0; i < sectionIndex; i++) {
        number += quiz.sections[i].questions.length;
      }
      return number + 1;
    },
    [quiz.sections]
  );

  // Get section and question index from continuous number
  const getIndicesFromNumber = useCallback(
    (number: number): [number, number] => {
      let remaining = number - 1;
      let sectionIndex = 0;
      while (remaining >= quiz.sections[sectionIndex].questions.length) {
        remaining -= quiz.sections[sectionIndex].questions.length;
        sectionIndex++;
      }
      return [sectionIndex, remaining];
    },
    [quiz.sections]
  );

  // Initialize question status
  useEffect(() => {
    const initialStatus: Record<string, QuestionStatus> = {};
    quiz.sections.forEach((section) => {
      section.questions.forEach((question) => {
        initialStatus[question.id] = {
          visited: false,
          answered: false,
          markedForReview: false,
          selectedAnswers: [],
        };
      });
    });
    setQuestionStatus(initialStatus);
    setTempAnswers({});

    if (quiz.sections[0]?.questions[0]) {
      const firstQuestionId = quiz.sections[0].questions[0].id;
      setQuestionStatus((prev) => ({
        ...prev,
        [firstQuestionId]: {
          ...prev[firstQuestionId],
          visited: true,
        },
      }));
    }
  }, [quiz]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    const currentSectionQuestions = quiz.sections[currentSection].questions;
    const currentQuestionId = currentSectionQuestions[currentQuestion].id;

    // Save the answer when clicking "Save & Next"
    if (tempAnswers[currentQuestionId]) {
      setQuestionStatus((prev) => ({
        ...prev,
        [currentQuestionId]: {
          ...prev[currentQuestionId],
          answered: tempAnswers[currentQuestionId].length > 0,
          selectedAnswers: tempAnswers[currentQuestionId],
        },
      }));
      setTempAnswers((prev) => {
        const newTemp = { ...prev };
        delete newTemp[currentQuestionId];
        return newTemp;
      });
    }

    if (currentQuestion < currentSectionQuestions.length - 1) {
      const nextQuestionId = currentSectionQuestions[currentQuestion + 1].id;
      setQuestionStatus((prev) => ({
        ...prev,
        [nextQuestionId]: {
          ...prev[nextQuestionId],
          visited: true,
        },
      }));
      setCurrentQuestion((prev) => prev + 1);
    } else if (currentSection < quiz.sections.length - 1) {
      const nextSectionFirstQuestionId =
        quiz.sections[currentSection + 1].questions[0].id;
      setQuestionStatus((prev) => ({
        ...prev,
        [nextSectionFirstQuestionId]: {
          ...prev[nextSectionFirstQuestionId],
          visited: true,
        },
      }));
      setCurrentSection((prev) => prev + 1);
      setCurrentQuestion(0);
    }
  }, [currentQuestion, currentSection, quiz.sections, tempAnswers]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      setCurrentQuestion(
        quiz.sections[currentSection - 1].questions.length - 1
      );
    }
  }, [currentQuestion, currentSection, quiz.sections]);

  const handleAnswerChange = useCallback(
    (questionId: string, answers: string[]) => {
      // Only store in tempAnswers, don't update questionStatus yet
      setTempAnswers((prev) => ({
        ...prev,
        [questionId]: answers,
      }));
    },
    []
  );

  const handleMarkForReview = useCallback(
    (questionId: string) => {
      // Save the answer when clicking "Mark for Review & Next"
      if (tempAnswers[questionId]) {
        setQuestionStatus((prev) => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            answered: tempAnswers[questionId].length > 0,
            selectedAnswers: tempAnswers[questionId],
            markedForReview: !prev[questionId].markedForReview,
          },
        }));
        setTempAnswers((prev) => {
          const newTemp = { ...prev };
          delete newTemp[questionId];
          return newTemp;
        });
      } else {
        setQuestionStatus((prev) => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            markedForReview: !prev[questionId].markedForReview,
          },
        }));
      }
      handleNext();
    },
    [handleNext, tempAnswers]
  );

  const handleClearResponse = useCallback((questionId: string) => {
    // Clear both temporary and saved answers
    setTempAnswers((prev) => ({
      ...prev,
      [questionId]: [],
    }));
    setQuestionStatus((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answered: false,
        selectedAnswers: [],
      },
    }));
  }, []);

  const handleJumpToQuestion = useCallback(
    (sectionIndex: number, questionIndex: number, questionId: string) => {
      // If there are unsaved changes in the current question, discard them
      setTempAnswers({});

      setCurrentSection(sectionIndex);
      setCurrentQuestion(questionIndex);
      setQuestionStatus((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          visited: true,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    const answers: Record<string, string[]> = {};
    Object.entries(questionStatus).forEach(([questionId, status]) => {
      answers[questionId] = status.selectedAnswers;
    });
    onSubmit(answers);
  }, [questionStatus, onSubmit]);

  // Timer effect
  useEffect(() => {
    if (view !== "quiz") return;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const updateTimer = () => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, quiz.totalDuration * 60 - elapsed);

      if (remaining === 0) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
        handleSubmit();
      } else {
        setTimeRemaining(remaining);
      }
    };

    timerRef.current = window.setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [view, quiz.totalDuration, handleSubmit]);

  // Status counters
  const getStatusCounts = useCallback(() => {
    const currentSectionQuestions = quiz.sections[currentSection].questions;
    return currentSectionQuestions.reduce(
      (counts, question) => {
        const status = questionStatus[question.id];
        if (!status?.visited) counts.notVisited++;
        else if (status.markedForReview && status.answered)
          counts.answeredAndMarked++;
        else if (status.markedForReview) counts.markedForReview++;
        else if (status.answered) counts.answered++;
        else counts.notAnswered++;
        return counts;
      },
      {
        notVisited: 0,
        notAnswered: 0,
        answered: 0,
        markedForReview: 0,
        answeredAndMarked: 0,
      }
    );
  }, [currentSection, questionStatus, quiz.sections]);

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

  // Render functions
  const renderInstructions = () => (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold mb-6">
          Please read the instructions carefully
        </h1>
      </div>
      <div>
        <h1 className="text-xl font-bold underline mb-6">
          General Instructions:
        </h1>
        <div>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <ul className="list-disc pl-6 space-y-2">
                <li className="text-gray-800">
                  Total duration of {quiz.title} is {quiz.totalDuration} min.
                </li>
              </ul>
            </li>
            <li className="text-gray-800">
              The clock will be set at the server. The countdown timer in the
              top right corner of screen will display the remaining time
              available for you to complete the examination. When the timer
              reaches zero, the examination will end by itself. You will not be
              required to end or submit your examination.
            </li>
            <li>
              <p className="mb-2 text-gray-800">
                The Questions Palette displayed on the right side of screen will
                show the status of each question using one of the following
                symbols:
              </p>
              <ol className="list-decimal pl-8 space-y-2">
                <li className="flex items-center gap-2">
                  <img src={Logo1} alt="Not visited" className="h-5 w-5" />{" "}
                  <span className="text-gray-800">
                    You have not visited the question yet.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <img src={Logo2} alt="Not answered" className="h-5 w-5" />{" "}
                  <span className="text-gray-800">
                    You have not answered the question.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <img src={Logo3} alt="Answered" className="h-5 w-5" />{" "}
                  <span className="text-gray-800">
                    You have answered the question.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <img
                    src={Logo4}
                    alt="Marked for review"
                    className="h-5 w-5"
                  />{" "}
                  <span className="text-gray-800">
                    You have NOT answered the question, but have marked the
                    question for review.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <img
                    src={Logo5}
                    alt="Answered and marked"
                    className="h-5 w-5"
                  />{" "}
                  <span className="text-gray-800">
                    The question(s) "Answered and Marked for Review" will be
                    considered for evalution.
                  </span>
                </li>
              </ol>
            </li>
            <li className="text-gray-800">
              You can click on the "&gt;" arrow which apperes to the left of
              question palette to collapse the question palette thereby
              maximizing the question window. To view the question palette
              again, you can click on "&lt;" which appears on the right side of
              question window.
            </li>
            <li className="text-gray-800">
              You can click on your "Profile" image on top right corner of your
              screen to change the language during the exam for entire question
              paper. On clicking of Profile image you will get a drop-down to
              change the question content to the desired language.
            </li>
            <li className="flex items-center gap-2 text-gray-800">
              You can click on{" "}
              <img src={down} alt="Scroll down" className="h-5 w-5" /> to
              navigate to the bottom and{" "}
              <img src={up} alt="Scroll up" className="h-5 w-5" /> to navigate
              to top of the question are, without scrolling.
            </li>
          </ol>
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold underline mb-6">
          Navigating to a Question:
        </h1>
        <div>
          <ol className="list-decimal pl-6 space-y-4" start={7}>
            <li className="text-gray-800">
              To answer a question, do the following:
              <ol className="list-[lower-alpha] pl-6 mt-2 space-y-2">
                <li>
                  Click on the question number in the Question Palette at the
                  right of your screen to go to that numbered question directly.
                  Note that using this option does NOT save your answer to the
                  current question.
                </li>
                <li>
                  Click on <strong>Save &amp; Next</strong> to save your answer
                  for the current question and then go to the next question.
                </li>
                <li>
                  Click on <strong>Mark for Review &amp; Next</strong> to save
                  your answer for the current question, mark it for review, and
                  then go to the next question.
                </li>
              </ol>
            </li>
          </ol>
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold underline mb-6">
          Answering a Question:
        </h1>
        <div>
          <ol className="list-decimal pl-6 space-y-4" start={8}>
            <li>
              Procedure for answering a multiple choice type question:
              <ol className="list-[lower-alpha] pl-6 mt-2 space-y-2">
                <li>
                  To select your answer, click on the button of one of the
                  options.
                </li>
                <li>
                  To deselect your chosen answer, click on the button of the
                  chosen option again or click on the{" "}
                  <strong>Clear Response</strong> button
                </li>
                <li>
                  To change your chosen answer, click on the button of another
                  option
                </li>
                <li>
                  To save your answer, you MUST click on the Save &amp; Next
                  button.
                </li>
                <li>
                  To mark the question for review, click on the Mark for Review
                  &amp; Next button.
                </li>
              </ol>
            </li>
            <li>
              To change your answer to a question that has already been
              answered, first select that question for answering and then follow
              the procedure for answering that type of question.
            </li>
          </ol>
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold underline mb-6">
          Navigating through sections:
        </h1>
        <div>
          <ol className="list-decimal pl-6 space-y-4" start={10}>
            <li>
              Sections in this question paper are displayed on the top bar of
              the screen. Questions in a section can be viewed by clicking on
              the section name. The section you are currently viewing is
              highlighted.
            </li>
            <li>
              After clicking the Save &amp; Next button on the last question for
              a section, you will automatically be taken to the first question
              of the next section.
            </li>
            <li>
              You can shuffle between sections and questions anytime during the
              examination as per your convenience only during the time
              stipulated.
            </li>
            <li>
              Candidate can view the corresponding section summary as part of
              the legend that appears in every section above the question
              palette.
            </li>
          </ol>
        </div>
      </div>
      <div className="space-y-4 mb-8">
        {quiz.instructions?.map((instruction, index) => (
          <p key={index}>{instruction}</p>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-8 border-b-1 border-t-1 border-gray-300 py-4">
        <input
          type="checkbox"
          id="accept-instructions"
          checked={acceptedInstructions}
          onChange={(e) => setAcceptedInstructions(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="accept-instructions">
          I have read and understood the instructions. All computer hardware
          allotted to me are in proper working condition. I declare that I am
          not in possession of / not wearing / not carrying any prohibited
          gadget like mobile phone, bluetooth devices etc. /any prohibited
          material with me into the Examination Hall.I agree that in case of not
          adhering to the instructions, I shall be liable to be debarred from
          this Test and/or to disciplinary action, which may include ban from
          future Tests / Examinations
        </label>
      </div>
      <button
        onClick={() => setView("quiz")}
        disabled={!acceptedInstructions}
        className={`px-6 py-2 rounded ${
          acceptedInstructions
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Proceed
      </button>
    </div>
  );

  const renderOptions = (question: Question) => {
    const status = questionStatus[question.id];
    const tempAnswer = tempAnswers[question.id];
    const options = [
      { id: "A", content: question.option_a },
      { id: "B", content: question.option_b },
      { id: "C", content: question.option_c },
      { id: "D", content: question.option_d },
    ];

    return (
      <div className="space-y-4 mt-4">
        {options.map((option) => (
          <div key={option.id} className="flex items-start gap-3">
            <input
              type={
                question.tags.question_type === "MMCQ" ? "checkbox" : "radio"
              }
              name={`question-${question.id}`}
              value={option.id}
              checked={
                tempAnswer
                  ? tempAnswer.includes(option.id)
                  : status?.selectedAnswers.includes(option.id)
              }
              onChange={(e) => {
                const value = e.target.value;
                const newAnswers =
                  question.tags.question_type === "MMCQ"
                    ? (tempAnswer || []).includes(value)
                      ? (tempAnswer || []).filter((a) => a !== value)
                      : [...(tempAnswer || []), value]
                    : [value];
                handleAnswerChange(question.id, newAnswers);
              }}
              className="mt-1"
            />
            <label className="flex-1">
              <span className="font-medium mr-2">{option.id}.</span>
              <MathText text={option.content} />
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderQuiz = () => {
    const section = quiz.sections[currentSection];
    const question = section.questions[currentQuestion];
    const status = questionStatus[question.id];
    const statusCounts = getStatusCounts();

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Institute Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {/* Placeholder for institute logo */}
                  <span className="text-gray-500 text-xl">PC</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Prof. P. C. Thomas & Chaithanya Classes
                  </h1>
                  <h2 className="text-lg text-gray-600">{quiz.title}</h2>
                </div>
              </div>
              <div className="text-lg font-medium">
                Time Left: {Math.floor(timeRemaining / 60)}:
                {String(timeRemaining % 60).padStart(2, "0")}
              </div>
            </div>
          </div>
        </header>

        {/* Section Tabs */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4">
              {quiz.sections.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => {
                    // Discard any unsaved changes when switching sections
                    setTempAnswers({});
                    setCurrentSection(index);
                    setCurrentQuestion(0);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    currentSection === index
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main
          className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${
            isCompactView ? "" : "grid grid-cols-4 gap-6"
          }`}
        >
          {/* Question Area */}
          <div
            className={`${
              isCompactView ? "max-w-3xl mx-auto" : "col-span-3"
            } bg-white shadow rounded-lg p-6 relative`}
          >
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">
                    Question Type: {question.tags.question_type}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600">Marks: +4.00</span>
                    <span className="text-red-600">Negative: -1.00</span>
                  </div>
                </div>
                <div className="text-lg font-medium mb-4">
                  Question {currentQuestion + 1}:
                </div>
                <div className="relative">
                  {/* Down scroll button at top */}
                  <button
                    onClick={() => handleScroll("down")}
                    className="absolute -top-8 right-0 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <img src={down} alt="Scroll down" className="h-5 w-5" />
                  </button>

                  <div
                    ref={questionContainerRef}
                    className="relative max-h-[400px] overflow-y-auto"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#4B5563 #E5E7EB",
                      scrollbarGutter: "stable",
                      paddingRight: "16px",
                    }}
                  >
                    <div className="prose max-w-none">
                      {renderMathContent(question.question_text)}
                      {question.image_url && (
                        <img
                          src={question.image_url}
                          alt="Question"
                          className="mt-4 max-w-full h-auto rounded-lg"
                        />
                      )}
                    </div>
                    {renderOptions(question)}
                  </div>

                  {/* Up scroll button at bottom */}
                  <button
                    onClick={() => handleScroll("up")}
                    className="absolute -bottom-8 right-0 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <img src={up} alt="Scroll up" className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <div className="space-x-4">
                <button
                  onClick={() => handleClearResponse(question.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Clear Response
                </button>
                <button
                  onClick={() => handleMarkForReview(question.id)}
                  className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                >
                  {status?.markedForReview
                    ? "Unmark for Review"
                    : "Mark for Review & Next"}
                </button>
              </div>
              <div className="space-x-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentSection === 0 && currentQuestion === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          {!isCompactView && (
            <div className="col-span-1 bg-white shadow rounded-lg p-6 pt-12 flex flex-col gap-4">
              {/* Status Counters */}
              <div className="mt-6 space-y-2 text-sm border-1 border-gray-500 border-dotted p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={Logo1} alt="not-visited" className="w-6 h-6" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold">
                        {statusCounts.notVisited}
                      </span>
                    </div>
                    <span>Not Visited</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={Logo2} alt="not-answered" className="w-6 h-6" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold">
                        {statusCounts.notAnswered}
                      </span>
                    </div>
                    <span>Not Answered</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img src={Logo3} alt="Answered" className="w-6 h-6" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold">
                        {statusCounts.answered}
                      </span>
                    </div>
                    <span>Answered</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={Logo4}
                        alt="Marked for Review"
                        className="w-6 h-6"
                      />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                        {statusCounts.markedForReview}
                      </span>
                    </div>
                    <span>Marked for Review</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={Logo5}
                        alt="Answered & Marked for Review"
                        className="w-6 h-6"
                      />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                        {statusCounts.answeredAndMarked}
                      </span>
                    </div>
                    <span>Answered & Marked for Review</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quiz.sections.map((s, sIndex) =>
                  s.questions.map((q, qIndex) => {
                    const qStatus = questionStatus[q.id];
                    const questionNum = getQuestionNumber(sIndex, qIndex);
                    let statusImage = Logo1; // Not Visited
                    let textColor = "text-black";

                    if (qStatus?.visited) {
                      if (qStatus.markedForReview && qStatus.answered) {
                        statusImage = Logo5; // Answered & Marked for Review
                        textColor = "text-white";
                      } else if (qStatus.markedForReview) {
                        statusImage = Logo4; // Marked for Review
                        textColor = "text-white";
                      } else if (qStatus.answered) {
                        statusImage = Logo3; // Answered
                      } else {
                        statusImage = Logo2; // Not Answered
                      }
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() =>
                          handleJumpToQuestion(sIndex, qIndex, q.id)
                        }
                        className={`p-2 rounded relative ${
                          currentSection === sIndex &&
                          currentQuestion === qIndex
                            ? "ring-2 ring-blue-500"
                            : ""
                        } hover:opacity-90`}
                      >
                        <img
                          src={statusImage}
                          alt="question status"
                          className="w-full h-full absolute top-0 left-0"
                        />
                        <span className={`relative z-10 ${textColor}`}>
                          {questionNum}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full mt-6 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
              >
                Submit Exam
              </button>
            </div>
          )}

          {/* Toggle View Button */}
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className={`fixed ${
              isCompactView ? "right-4" : "right-80"
            } top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-300`}
          >
            {isCompactView ? "←" : "→"}
          </button>
        </main>
      </div>
    );
  };

  return view === "instructions" ? renderInstructions() : renderQuiz();
}
