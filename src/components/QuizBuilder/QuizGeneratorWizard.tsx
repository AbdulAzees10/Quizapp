import React, { useState, useMemo, useEffect } from 'react';
import { 
  Question, 
  Quiz, 
  QuizSection, 
  TagSystem, 
  DifficultyLevel, 
  QuestionType,
  ChapterDistribution,
  TopicDistribution
} from '../../types';
// import { generateFullQuiz } from '../../src/utils/quizGenerator';

interface QuizGeneratorWizardProps {
  questions: Question[];
  tagSystem: TagSystem;
  onGenerate: (sections: QuizSection[]) => void;
  onCancel: () => void;
  usedQuestions?: Set<string>; // Track questions already used in other sections
}

interface SectionSetup {
  id: string;
  subject: string;
  questionCount: number;
  difficultyDistribution: Record<DifficultyLevel, number>;
  typeDistribution: Record<QuestionType, number>;
  chapterDistribution: ChapterDistribution[];
}

type Step = 'exam' | 'sections' | 'filters';

export const QuizGeneratorWizard: React.FC<QuizGeneratorWizardProps> = ({
  questions,
  tagSystem,
  onGenerate,
  onCancel,
  usedQuestions = new Set(),
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('exam');
  const [examType, setExamType] = useState('');
  const [sections, setSections] = useState<SectionSetup[]>([]);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);

  // Available subjects for selected exam type
  const availableSubjects = useMemo(() => 
    tagSystem.subjects[examType] || [],
    [examType, tagSystem.subjects]
  );

  // Get available chapters for a subject
  const getAvailableChapters = (subject: string): string[] => 
    tagSystem.chapters[subject] || [];

  // Get available topics for a chapter
  const getAvailableTopics = (chapter: string): string[] => 
    tagSystem.topics[chapter] || [];

  // Update getFilteredQuestions to track used questions within topics
  const getFilteredQuestions = (section: SectionSetup, chapter?: string, excludeIds: Set<string> = new Set()): Question[] => {
    if (!section.subject || !examType) return [];

    return questions.filter(q => {
      if (usedQuestions.has(q.id) || excludeIds.has(q.id)) return false;

      const matchesExamType = q.tags.exam_type === examType;
      const matchesSubject = q.tags.subject === section.subject;
      const matchesChapter = chapter 
        ? q.tags.chapter === chapter
        : section.chapterDistribution.some(cd => cd.chapter === q.tags.chapter);

      return matchesExamType && matchesSubject && matchesChapter;
    });
  };

  // Get total questions count from chapter distribution
  const getTotalQuestions = (chapterDist: ChapterDistribution[]): number => {
    return chapterDist.reduce((total: number, chapter) => total + chapter.count, 0);
  };

  // Update calculateInitialDistributions to use tags
  const calculateInitialDistributions = (section: SectionSetup) => {
    const availableQuestions = getFilteredQuestions(section);
    
    // Count questions by difficulty and type
    const difficultyCount = {
      Easy: availableQuestions.filter(q => q.tags.difficulty_level === 'Easy').length,
      Medium: availableQuestions.filter(q => q.tags.difficulty_level === 'Medium').length,
      Hard: availableQuestions.filter(q => q.tags.difficulty_level === 'Hard').length
    };

    const typeCount = {
      MCQ: availableQuestions.filter(q => q.tags.question_type === 'MCQ').length,
      MMCQ: availableQuestions.filter(q => q.tags.question_type === 'MMCQ').length,
      Numeric: availableQuestions.filter(q => q.tags.question_type === 'Numeric').length
    };

    const totalQuestions = availableQuestions.length;

    console.log('Available questions:', {
      total: totalQuestions,
      byDifficulty: difficultyCount,
      byType: typeCount
    });

    if (totalQuestions === 0) {
      return {
        difficultyDistribution: section.difficultyDistribution || { Easy: 30, Medium: 50, Hard: 20 },
        typeDistribution: section.typeDistribution || { MCQ: 60, MMCQ: 20, Numeric: 20 }
      };
    }

    // Calculate percentages
    const calculatePercentages = (counts: Record<string, number>) => {
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      if (total === 0) return null;

      const distribution = Object.fromEntries(
        Object.entries(counts).map(([key, count]) => [
          key,
          Math.round((count / total) * 100)
        ])
      );

      // Adjust to ensure 100% total
      const distTotal = Object.values(distribution).reduce((sum, val) => sum + val, 0);
      if (distTotal !== 100) {
        const maxKey = Object.entries(distribution)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        distribution[maxKey] += (100 - distTotal);
      }

      return distribution;
    };

    return {
      difficultyDistribution: calculatePercentages(difficultyCount) || section.difficultyDistribution,
      typeDistribution: calculatePercentages(typeCount) || section.typeDistribution
    };
  };

  // Update the handleAddSection function
  const handleAddSection = () => {
    const newSection: SectionSetup = {
      id: crypto.randomUUID(),
      subject: '',
      questionCount: 10,
      difficultyDistribution: {
        Easy: 30,
        Medium: 50,
        Hard: 20,
      },
      typeDistribution: {
        MCQ: 60,
        MMCQ: 20,
        Numeric: 20,
      },
      chapterDistribution: [],
    };
    setSections(prev => [...prev, newSection]);
  };

  // Update chapter distribution
  const handleUpdateChapterDistribution = (
    sectionIndex: number,
    chapter: string,
    count: number,
    topics?: TopicDistribution[]
  ): void => {
    setSections(prev => {
      const newSections = [...prev];
      const section = newSections[sectionIndex];
      const availableQuestions = getFilteredQuestions(section, chapter);
      
      // Limit count to available questions
      const validCount = Math.min(count, availableQuestions.length);
      
      const chapterIndex = section.chapterDistribution.findIndex(
        d => d.chapter === chapter
      );

      if (chapterIndex >= 0) {
        section.chapterDistribution[chapterIndex] = {
          chapter,
          count: validCount,
          topics: topics || section.chapterDistribution[chapterIndex].topics,
        };
      } else {
        section.chapterDistribution.push({
          chapter,
          count: validCount,
          topics: topics || [],
        });
      }

      // Update total question count based on chapter distribution
      section.questionCount = getTotalQuestions(section.chapterDistribution);
      return newSections;
    });
  };

  // Update topic distribution
  const handleUpdateTopicDistribution = (
    sectionIndex: number,
    chapter: string,
    topic: string,
    count: number
  ): void => {
    setSections(prev => {
      const newSections = [...prev];
      const section = newSections[sectionIndex];
      const chapterDist = section.chapterDistribution.find(
        d => d.chapter === chapter
      );

      if (chapterDist) {
        // Calculate total topics count excluding current topic
        const otherTopicsCount = chapterDist.topics
          .filter(t => t.topic !== topic)
          .reduce((sum, t) => sum + t.count, 0);

        // Ensure new total doesn't exceed chapter count
        const maxAllowedCount = chapterDist.count - otherTopicsCount;
        const validCount = Math.min(count, maxAllowedCount);

        const topicIndex = chapterDist.topics.findIndex(t => t.topic === topic);
        if (topicIndex >= 0) {
          chapterDist.topics[topicIndex] = { topic, count: validCount };
        } else {
          chapterDist.topics.push({ topic, count: validCount });
        }
      }

      return newSections;
    });
  };

  // Update a section
  const handleUpdateSection = (index: number, updates: Partial<SectionSetup>): void => {
    setSections(prev => prev.map((section, i) => 
      i === index 
        ? { 
            ...section, 
            ...updates,
            // Ensure distributions total 100%
            difficultyDistribution: updates.difficultyDistribution || section.difficultyDistribution,
            typeDistribution: updates.typeDistribution || section.typeDistribution
          } 
        : section
    ));
  };

  // Remove a section
  const handleRemoveSection = (index: number): void => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  // Validation functions for each step
  const validateExamStep = (): string[] => {
    if (!examType) return ['Please select an exam type'];
    return [];
  };

  // Update getAvailableQuestionsByDifficulty to use tags
  const getAvailableQuestionsByDifficulty = (section: SectionSetup): Record<DifficultyLevel, number> => {
    const filteredQuestions = getFilteredQuestions(section);
    
    return {
      Easy: filteredQuestions.filter(q => q.tags.difficulty_level === 'Easy').length,
      Medium: filteredQuestions.filter(q => q.tags.difficulty_level === 'Medium').length,
      Hard: filteredQuestions.filter(q => q.tags.difficulty_level === 'Hard').length
    };
  };

  // Update getAvailableQuestionsByType to use tags
  const getAvailableQuestionsByType = (section: SectionSetup): Record<QuestionType, number> => {
    const filteredQuestions = getFilteredQuestions(section);
    
    return {
      MCQ: filteredQuestions.filter(q => q.tags.question_type === 'MCQ').length,
      MMCQ: filteredQuestions.filter(q => q.tags.question_type === 'MMCQ').length,
      Numeric: filteredQuestions.filter(q => q.tags.question_type === 'Numeric').length
    };
  };

  // Update validateTopicDistribution to check chapter question availability
  const validateTopicDistribution = (
    chapterDist: ChapterDistribution,
    availableQuestions: Question[]
  ): string[] => {
    const errors: string[] = [];

    // Check if chapter has enough questions
    if (availableQuestions.length < chapterDist.count) {
      errors.push(
        `Not enough questions available (need ${chapterDist.count}, have ${availableQuestions.length})`
      );
      return errors; // Return early since we can't validate topics without enough chapter questions
    }

    const topicsTotal = chapterDist.topics.reduce((sum, t) => sum + t.count, 0);

    if (topicsTotal > chapterDist.count) {
      errors.push(
        `Total topic questions (${topicsTotal}) exceeds chapter count (${chapterDist.count})`
      );
    }

    // Validate each topic has enough questions
    const usedQuestionIds = new Set<string>();
    chapterDist.topics.forEach(topic => {
      const topicQuestions = availableQuestions.filter(q => 
        q.tags.topic === topic.topic && !usedQuestionIds.has(q.id)
      );
      
      if (topicQuestions.length < topic.count) {
        errors.push(
          `Not enough questions for topic "${topic.topic}" ` +
          `(need ${topic.count}, have ${topicQuestions.length})`
        );
      } else {
        // Track used questions
        topicQuestions.slice(0, topic.count).forEach(q => usedQuestionIds.add(q.id));
      }
    });

    return errors;
  };

  // Update validateSectionsStep to include topic distribution validation
  const validateSectionsStep = (): string[] => {
    const errors: string[] = [];
    
    sections.forEach((section, index) => {
      if (!section.subject) {
        errors.push(`Section ${index + 1}: Please select a subject`);
        return;
      }

      // Validate each chapter's topic distribution
      section.chapterDistribution.forEach(chapterDist => {
        const chapterQuestions = getFilteredQuestions(section, chapterDist.chapter);
        const topicErrors = validateTopicDistribution(chapterDist, chapterQuestions);
        
        topicErrors.forEach(error => {
          errors.push(`Section ${index + 1}, ${chapterDist.chapter}: ${error}`);
        });
      });

      // Get available questions for this section
      const availableQuestions = getFilteredQuestions(section);
      console.log('Available questions for validation:', availableQuestions);

      // Calculate required counts based on percentages and total questions
      const totalQuestionsNeeded = section.chapterDistribution.reduce(
        (sum, chapter) => sum + chapter.count, 
        0
      );

      // Validate difficulty distribution
      const availableByDifficulty = {
        Easy: availableQuestions.filter(q => q.tags.difficulty_level === 'Easy').length,
        Medium: availableQuestions.filter(q => q.tags.difficulty_level === 'Medium').length,
        Hard: availableQuestions.filter(q => q.tags.difficulty_level === 'Hard').length
      };

      Object.entries(section.difficultyDistribution).forEach(([difficulty, percentage]) => {
        const neededCount = Math.ceil((percentage / 100) * totalQuestionsNeeded);
        const availableCount = availableByDifficulty[difficulty as DifficultyLevel];

        console.log(`${difficulty} validation:`, {
          needed: neededCount,
          available: availableCount,
          percentage,
          totalNeeded: totalQuestionsNeeded
        });

        if (neededCount > availableCount) {
          errors.push(
            `Section ${index + 1}: Not enough ${difficulty} questions available. ` +
            `Need ${neededCount} (${percentage}%), but only have ${availableCount}`
          );
        }
      });

      // Validate type distribution
      const availableByType = {
        MCQ: availableQuestions.filter(q => q.tags.question_type === 'MCQ').length,
        MMCQ: availableQuestions.filter(q => q.tags.question_type === 'MMCQ').length,
        Numeric: availableQuestions.filter(q => q.tags.question_type === 'Numeric').length
      };

      Object.entries(section.typeDistribution).forEach(([type, percentage]) => {
        const neededCount = Math.ceil((percentage / 100) * totalQuestionsNeeded);
        const availableCount = availableByType[type as QuestionType];

        console.log(`${type} validation:`, {
          needed: neededCount,
          available: availableCount,
          percentage,
          totalNeeded: totalQuestionsNeeded
        });

        if (neededCount > availableCount) {
          errors.push(
            `Section ${index + 1}: Not enough ${type} questions available. ` +
            `Need ${neededCount} (${percentage}%), but only have ${availableCount}`
          );
        }
      });
    });

    return errors;
  };

  const validateFiltersStep = (): string[] => {
    const errors: string[] = [];
    sections.forEach((section, index) => {
      const availableQuestions = getFilteredQuestions(section);
      if (availableQuestions.length < section.questionCount) {
        errors.push(
          `Section ${index + 1}: Not enough questions available (need ${section.questionCount}, have ${availableQuestions.length})`
        );
      }
    });
    return errors;
  };

  // Real-time validation
  useEffect(() => {
    let errors: string[] = [];
    switch (currentStep) {
      case 'exam':
        errors = validateExamStep();
        break;
      case 'sections':
        errors = validateSectionsStep();
        break;
      case 'filters':
        errors = validateFiltersStep();
        break;
    }
    setGenerationErrors(errors);
  }, [currentStep, examType, sections]);

  // Check if can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'exam':
        return examType !== '';
      case 'sections':
        return sections.length > 0 && sections.every(section => 
          section.subject &&
          section.chapterDistribution.length > 0 &&
          Object.values(section.difficultyDistribution).reduce((sum, val) => sum + val, 0) === 100 &&
          Object.values(section.typeDistribution).reduce((sum, val) => sum + val, 0) === 100
        );
      case 'filters':
        return sections.every(section => {
          const availableQuestions = getFilteredQuestions(section);
          return availableQuestions.length >= section.questionCount;
        });
      default:
        return false;
    }
  }, [currentStep, examType, sections]);

  // Handle next step
  const handleNext = () => {
    if (!canProceed) return;

    switch (currentStep) {
      case 'exam':
        setCurrentStep('sections');
        setGenerationErrors([]); // Clear errors when moving to next step
        break;
      case 'sections':
        setCurrentStep('filters');
        setGenerationErrors([]); // Clear errors when moving to next step
        break;
      case 'filters':
        handleGenerate();
        break;
    }
  };

  // Handle back
  const handleBack = () => {
    switch (currentStep) {
      case 'sections':
        setCurrentStep('exam');
        break;
      case 'filters':
        setCurrentStep('sections');
        break;
    }
  };

  // Generate quiz sections
  const handleGenerate = () => {
    if (!canProceed) return;

    const generatedSections: QuizSection[] = sections.map(setup => {
      const sectionQuestions: Question[] = [];
      
      // Get questions according to chapter distribution
      setup.chapterDistribution.forEach(chapter => {
        const chapterQuestions = getFilteredQuestions(setup, chapter.chapter);
        
        if (chapter.topics && chapter.topics.length > 0) {
          // Select questions by topic distribution
          chapter.topics.forEach(topic => {
            const topicQuestions = getFilteredQuestions(setup, chapter.chapter);
            const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
            sectionQuestions.push(...shuffled.slice(0, topic.count));
          });
        } else {
          // Select questions from chapter without topic distribution
          const shuffled = [...chapterQuestions].sort(() => Math.random() - 0.5);
          sectionQuestions.push(...shuffled.slice(0, chapter.count));
        }
      });

      return {
        id: setup.id,
        name: `${setup.subject} Section`,
        timerEnabled: false,
        marks: Math.round((100 / setup.questionCount) * 10) / 10, // Distribute marks evenly
        negativeMarks: Math.round((100 / setup.questionCount) * 0.25 * 10) / 10,
        questions: sectionQuestions,
      };
    });

    onGenerate(generatedSections);
  };

  // Update the effect to recalculate distributions when needed
  useEffect(() => {
    // Create a stable reference for section changes
    const sectionsToUpdate = sections.filter(
      section => section.subject && section.chapterDistribution.length > 0
    );

    // Only update if distributions need to be recalculated
    sectionsToUpdate.forEach((section, index) => {
      const { difficultyDistribution, typeDistribution } = calculateInitialDistributions(section);
      
      // Check if distributions have actually changed before updating
      const hasDistributionChanged = 
        JSON.stringify(section.difficultyDistribution) !== JSON.stringify(difficultyDistribution) ||
        JSON.stringify(section.typeDistribution) !== JSON.stringify(typeDistribution);

      if (hasDistributionChanged) {
        handleUpdateSection(index, {
          difficultyDistribution,
          typeDistribution
        });
      }
    });
  }, [examType]); // Only depend on examType changes

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['exam', 'sections', 'filters'] as Step[]).map((step, index) => (
            <button
              key={step}
              onClick={() => {
                if (index < ['exam', 'sections', 'filters'].indexOf(currentStep)) {
                  setCurrentStep(step);
                }
              }}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${currentStep === step
                  ? 'border-blue-500 text-blue-600'
                  : index < ['exam', 'sections', 'filters'].indexOf(currentStep)
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {index + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div className="mt-6">
        {currentStep === 'exam' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Exam Type
              </label>
              <select
                value={examType}
                onChange={e => {
                  setExamType(e.target.value);
                  setGenerationErrors([]); // Clear errors on change
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select an exam type</option>
                {tagSystem.exam_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 'sections' && (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        Section {index + 1}
                      </h3>
                      <button
                        onClick={() => handleRemoveSection(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Subject
                        </label>
                        <select
                          value={section.subject}
                          onChange={e => {
                            handleUpdateSection(index, { 
                              subject: e.target.value,
                              chapterDistribution: [] // Reset chapter distribution when subject changes
                            });
                            setGenerationErrors([]); // Clear errors on change
                          }}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select a subject</option>
                          {availableSubjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {section.subject && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Distribution
                        </label>
                        <div className="space-y-4">
                          {getAvailableChapters(section.subject).map(chapter => {
                            const chapterDist = section.chapterDistribution.find(
                              d => d.chapter === chapter
                            );
                            const availableQuestions = getFilteredQuestions(section, chapter);
                            const hasEnoughQuestions = (chapterDist?.count || 0) <= availableQuestions.length;
                            
                            return (
                              <div key={chapter} className="border rounded-md p-4">
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="font-medium">{chapter}</span>
                                  <input
                                    type="number"
                                    value={chapterDist?.count || 0}
                                    onChange={e => {
                                      const count = parseInt(e.target.value) || 0;
                                      handleUpdateChapterDistribution(index, chapter, count);
                                    }}
                                    min="0"
                                    max={availableQuestions.length}
                                    className={`w-24 px-2 py-1 border rounded-md ${
                                      hasEnoughQuestions 
                                        ? 'border-gray-300' 
                                        : 'border-red-300'
                                    }`}
                                  />
                                  <span className="text-sm text-gray-500">questions</span>
                                  <span className={`text-sm ${
                                    hasEnoughQuestions ? 'text-gray-500' : 'text-red-600'
                                  }`}>
                                    (Available: {availableQuestions.length})
                                  </span>
                                </div>

                                {!hasEnoughQuestions && (
                                  <div className="text-sm text-red-600 mb-2">
                                    Not enough questions available for this chapter
                                  </div>
                                )}

                                {chapterDist && chapterDist.count > 0 && (
                                  <div className="ml-4 border-l pl-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Topic Distribution (Optional)
                                    </label>
                                    <div className="space-y-2">
                                      {getAvailableTopics(chapter).map(topic => {
                                        const topicDist = chapterDist.topics.find(
                                          t => t.topic === topic
                                        );
                                        return (
                                          <div key={topic} className="flex items-center gap-4">
                                            <span className="text-sm">{topic}</span>
                                            <input
                                              type="number"
                                              value={topicDist?.count || 0}
                                              onChange={e => {
                                                const count = parseInt(e.target.value) || 0;
                                                handleUpdateTopicDistribution(
                                                  index,
                                                  chapter,
                                                  topic,
                                                  count
                                                );
                                              }}
                                              min="0"
                                              max={chapterDist.count}
                                              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Difficulty Distribution (%)
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(section.difficultyDistribution).map(([difficulty, percentage]) => {
                            const availableByDifficulty = getAvailableQuestionsByDifficulty(section);
                            const requestedCount = Math.ceil((percentage / 100) * section.questionCount);
                            const availableCount = availableByDifficulty[difficulty as DifficultyLevel];
                            const isValid = requestedCount <= availableCount;

                            return (
                              <div key={difficulty} className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <label className="w-20 text-sm">{difficulty}</label>
                                  <input
                                    type="number"
                                    value={percentage}
                                    onChange={e => {
                                      const newValue = parseInt(e.target.value) || 0;
                                      handleUpdateSection(index, {
                                        difficultyDistribution: {
                                          ...section.difficultyDistribution,
                                          [difficulty]: newValue
                                        }
                                      });
                                    }}
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 text-sm border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className={`text-xs ${isValid ? 'text-gray-500' : 'text-red-600'}`}>
                                  Available: {availableCount} questions
                                  {!isValid && ` (Need ${requestedCount})`}
                                </div>
                              </div>
                            );
                          })}
                          <div className={`text-sm ${
                            Object.values(section.difficultyDistribution).reduce((sum, val) => sum + val, 0) === 100
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            Total: {Object.values(section.difficultyDistribution).reduce((sum, val) => sum + val, 0)}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Question Type Distribution (%)
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(section.typeDistribution).map(([type, percentage]) => {
                            const availableByType = getAvailableQuestionsByType(section);
                            const requestedCount = Math.ceil((percentage / 100) * section.questionCount);
                            const availableCount = availableByType[type as QuestionType];
                            const isValid = requestedCount <= availableCount;

                            return (
                              <div key={type} className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <label className="w-20 text-sm">{type}</label>
                                  <input
                                    type="number"
                                    value={percentage}
                                    onChange={e => {
                                      const newValue = parseInt(e.target.value) || 0;
                                      handleUpdateSection(index, {
                                        typeDistribution: {
                                          ...section.typeDistribution,
                                          [type]: newValue
                                        }
                                      });
                                    }}
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 text-sm border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className={`text-xs ${isValid ? 'text-gray-500' : 'text-red-600'}`}>
                                  Available: {availableCount} questions
                                  {!isValid && ` (Need ${requestedCount})`}
                                </div>
                              </div>
                            );
                          })}
                          <div className={`text-sm ${
                            Object.values(section.typeDistribution).reduce((sum, val) => sum + val, 0) === 100
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            Total: {Object.values(section.typeDistribution).reduce((sum, val) => sum + val, 0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddSection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Section
            </button>
          </div>
        )}

        {currentStep === 'filters' && (
          <div className="space-y-6">
            {sections.map((section, index) => {
              const filteredQuestions = getFilteredQuestions(section);
              return (
                <div key={section.id} className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {section.subject} - Section {index + 1}
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Chapter Distribution</h4>
                        {section.chapterDistribution.map(chapter => (
                          <div key={chapter.chapter} className="ml-4">
                            <div className="font-medium">{chapter.chapter}: {chapter.count} questions</div>
                            {chapter.topics.length > 0 && (
                              <div className="ml-4 text-sm text-gray-600">
                                {chapter.topics.map(topic => (
                                  <div key={topic.topic}>
                                    {topic.topic}: {topic.count} questions
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className={`text-sm ${
                        filteredQuestions.length >= section.questionCount
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        Available Questions: {filteredQuestions.length}
                        {filteredQuestions.length < section.questionCount &&
                          ` (need ${section.questionCount})`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {generationErrors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside">
                  {generationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <div className="space-x-4">
          {currentStep !== 'exam' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {currentStep === 'filters' ? 'Generate Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
