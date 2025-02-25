import React, { useState } from 'react';
import TagManager from '../components/TagManager/TagManager';
import { QuestionCreator } from '../components/QuestionCreator/QuestionCreator';
import { QuestionList } from '../components/QuestionList/QuestionList';
import { QuestionBulkUploader } from '../components/QuestionBulkUploader/QuestionBulkUploader';
import { QuizBuilder } from '../components/QuizBuilder/QuizBuilder';
import { QuizList } from '../components/QuizList/QuizList';
import { QuizTaker } from '../components/QuizTaker/QuizTaker';
import { Question, Quiz, TagSystem, DifficultyLevel, QuestionType } from '../types';
import { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  // State Management
  const [tagSystem, setTagSystem] = useState<TagSystem>({
    exam_types: [],
    subjects: {},
    chapters: {},
    topics: {},
    difficulty_levels: ['Easy', 'Medium', 'Hard'] as DifficultyLevel[],
    question_types: ['MCQ', 'Numeric', 'MMCQ'] as QuestionType[],
    sources: []
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'upload' | 'tags' | 'quiz' | 'quizzes' | 'take-quiz'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | undefined>(undefined);

  // Question Management Functions
  const handleCreateQuestion = (question: Question) => {
    setQuestions(prev => [...prev, question]);
  };

  const handleUpdateQuestion = (question: Question) => {
    setQuestions(prev => prev.map(q => q.id === question.id ? question : q));
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleBulkUpload = (newQuestions: Question[]) => {
    setQuestions(prev => [...prev, ...newQuestions]);
  };

  // Quiz Management Functions
  const handleSaveQuiz = async (quiz: Quiz, updatedQuestions?: Question[]) => {
    setQuizzes(prev => {
      const index = prev.findIndex(q => q.id === quiz.id);
      if (index >= 0) {
        return [...prev.slice(0, index), quiz, ...prev.slice(index + 1)];
      }
      return [...prev, quiz];
    });
    
    if (updatedQuestions) {
      setQuestions(updatedQuestions);
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
  };

  const handleDuplicateQuiz = (quiz: Quiz) => {
    const now = new Date().toISOString();
    const duplicatedQuiz: Quiz = {
      ...quiz,
      id: crypto.randomUUID(),
      title: `${quiz.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setQuizzes(prev => [...prev, duplicatedQuiz]);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setActiveTab('quiz');
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setActiveTab('take-quiz');
  };

  const handleQuizSubmit = (answers: Record<string, string[]>) => {
    console.log('Quiz submitted:', answers);
    setActiveTab('quizzes');
    setSelectedQuiz(undefined);
  };

  // Tag Management Functions
  const handleNewTag = (
    category: 'exam_types' | 'sources' | 'difficulty_levels' | 'question_types',
    value: string
  ) => {
    const newTagSystem = { ...tagSystem };
    
    switch (category) {
      case 'difficulty_levels':
        if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
          if (!newTagSystem.difficulty_levels.includes(value as DifficultyLevel)) {
            newTagSystem.difficulty_levels = [...newTagSystem.difficulty_levels, value as DifficultyLevel];
          }
        }
        break;
      case 'question_types':
        if (value === 'MCQ' || value === 'Numeric' || value === 'MMCQ') {
          if (!newTagSystem.question_types.includes(value as QuestionType)) {
            newTagSystem.question_types = [...newTagSystem.question_types, value as QuestionType];
          }
        }
        break;
      case 'exam_types':
      case 'sources':
        if (!newTagSystem[category].includes(value)) {
          newTagSystem[category] = [...newTagSystem[category], value];
        }
        break;
    }
    
    setTagSystem(newTagSystem);
  };

  const handleNewHierarchicalTag = (
    examType: string,
    subject: string,
    chapter: string,
    topic: string
  ) => {
    const newTagSystem = { ...tagSystem };

    if (!newTagSystem.exam_types.includes(examType)) {
      newTagSystem.exam_types = [...newTagSystem.exam_types, examType];
    }

    if (!newTagSystem.subjects[examType]) {
      newTagSystem.subjects[examType] = [];
    }
    if (!newTagSystem.subjects[examType].includes(subject)) {
      newTagSystem.subjects[examType] = [...newTagSystem.subjects[examType], subject];
    }

    if (!newTagSystem.chapters[subject]) {
      newTagSystem.chapters[subject] = [];
    }
    if (!newTagSystem.chapters[subject].includes(chapter)) {
      newTagSystem.chapters[subject] = [...newTagSystem.chapters[subject], chapter];
    }

    if (!newTagSystem.topics[chapter]) {
      newTagSystem.topics[chapter] = [];
    }
    if (!newTagSystem.topics[chapter].includes(topic)) {
      newTagSystem.topics[chapter] = [...newTagSystem.topics[chapter], topic];
    }

    setTagSystem(newTagSystem);
  };

  return (
    <div className="min-h-screen ">
      <Toaster position="top-right" />
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'list'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                View Questions
              </button>
              <button
                onClick={() => {
                  setSelectedQuestion(undefined);
                  setActiveTab('create');
                }}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {selectedQuestion ? 'Edit Question' : 'Create Question'}
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'upload'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bulk Upload
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'quiz'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quiz Builder
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'quizzes'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                View Quizzes
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'tags'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Tags
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {activeTab === 'list' && (
          <QuestionList
            questions={questions}
            tagSystem={tagSystem}
            onEditQuestion={question => {
              setSelectedQuestion(question);
              setActiveTab('create');
            }}
            onDeleteQuestion={handleDeleteQuestion}
            quizzes={quizzes}
          />
        )}

        {activeTab === 'create' && (
          <QuestionCreator
            initialQuestion={selectedQuestion || undefined}
            questions={questions}
            tagSystem={tagSystem}
            onSave={question => {
              selectedQuestion ? handleUpdateQuestion(question) : handleCreateQuestion(question);
              setSelectedQuestion(undefined);
              setActiveTab('list');
            }}
            onNewTag={handleNewTag}
            onNewHierarchicalTag={handleNewHierarchicalTag}
          />
        )}

        {activeTab === 'upload' && (
          <QuestionBulkUploader
            questions={questions}
            tagSystem={tagSystem}
            onImport={handleBulkUpload}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizBuilder
            questions={questions}
            tagSystem={tagSystem}
            onSave={handleSaveQuiz}
            initialQuiz={selectedQuiz}
            quizzes={quizzes}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizList
            quizzes={quizzes}
            onEditQuiz={handleEditQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onDuplicateQuiz={handleDuplicateQuiz}
            onTakeQuiz={handleTakeQuiz}
          />
        )}

        {activeTab === 'tags' && (
          <TagManager
            tagSystem={tagSystem}
            questions={questions}
            onUpdateTagSystem={setTagSystem}
          />
        )}

        {activeTab === 'take-quiz' && selectedQuiz && (
          <QuizTaker
            quiz={selectedQuiz}
            onSubmit={handleQuizSubmit}
          />
        )}
      </main>
    </div>
  );
}
