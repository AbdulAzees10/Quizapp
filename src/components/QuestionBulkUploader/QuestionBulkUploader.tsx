import React, { useState } from 'react';
import Papa from 'papaparse';
import { Question, TagSystem } from '../../types';
import { findSimilarQuestions } from '../../utils/similarity';

interface ValidationError {
  row: number;
  errors: string[];
}

interface ValidationResult {
  validQuestions: Question[];
  duplicatesInCsv: { keptRow: number; skippedRows: number[]; similarity: number }[];
  duplicatesInSystem: { row: number; questionId: string; similarity: number }[];
  invalidTags: ValidationError[];
}

interface QuestionBulkUploaderProps {
  questions: Question[];
  tagSystem: TagSystem;
  onImport: (questions: Question[]) => void;
}

const convertRowToQuestion = (row: any): Question => ({
  id: crypto.randomUUID(),
  question_text: row.question_text,
  option_a: row.option_a || '',
  option_b: row.option_b || '',
  option_c: row.option_c || '',
  option_d: row.option_d || '',
  correct_answer: row.correct_answer,
  explanation: row.explanation?.trim() || '',
  image_url: row.question_image_url || '',
  option_a_image_url: row.a_image_url || '',
  option_b_image_url: row.b_image_url || '',
  option_c_image_url: row.c_image_url || '',
  option_d_image_url: row.d_image_url || '',
  explanation_image_url: row.explanation_image_url || '',
  tags: {
    exam_type: row.exam_type,
    subject: row.subject,
    chapter: row.chapter,
    topic: row.topic,
    difficulty_level: row.difficulty_level,
    question_type: row.question_type,
    source: row.source,
  },
});

const validateCsv = async (
  csvData: any[],
  existingQuestions: Question[],
  tagSystem: TagSystem
): Promise<ValidationResult> => {
  const result: ValidationResult = {
    validQuestions: [],
    duplicatesInCsv: [],
    duplicatesInSystem: [],
    invalidTags: []
  };

  // Required columns
  const requiredColumns = [
    'exam_type', 'subject', 'chapter', 'topic', 'difficulty_level',
    'question_type', 'source', 'question_text', 'correct_answer'
  ];

  // Check each row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const errors: string[] = [];

    // Check required fields
    for (const field of requiredColumns) {
      if (!row[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate tags exist
    if (!tagSystem.exam_types.includes(row.exam_type)) {
      errors.push(`Invalid exam_type: ${row.exam_type}`);
    }
    if (!tagSystem.subjects[row.exam_type]?.includes(row.subject)) {
      errors.push(`Invalid subject: ${row.subject} for exam type: ${row.exam_type}`);
    }
    if (!tagSystem.chapters[row.subject]?.includes(row.chapter)) {
      errors.push(`Invalid chapter: ${row.chapter} for subject: ${row.subject}`);
    }
    if (!tagSystem.topics[row.chapter]?.includes(row.topic)) {
      errors.push(`Invalid topic: ${row.topic} for chapter: ${row.chapter}`);
    }
    if (!tagSystem.difficulty_levels.includes(row.difficulty_level)) {
      errors.push(`Invalid difficulty_level: ${row.difficulty_level}`);
    }
    if (!tagSystem.question_types.includes(row.question_type)) {
      errors.push(`Invalid question_type: ${row.question_type}`);
    }
    if (!tagSystem.sources.includes(row.source)) {
      errors.push(`Invalid source: ${row.source}`);
    }

    // Validate options and answer based on question type
    if (row.question_type === 'MCQ' || row.question_type === 'MMCQ') {
      // MCQ and MMCQ require all options
      if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) {
        errors.push('MCQ/MMCQ questions require all options (A, B, C, D)');
      }
      
      if (row.question_type === 'MCQ' && !['A', 'B', 'C', 'D'].includes(row.correct_answer)) {
        errors.push('MCQ correct_answer must be A, B, C, or D');
      }
      
      if (row.question_type === 'MMCQ') {
        const answers = row.correct_answer.split(',').map((a: string) => a.trim());
        const uniqueAnswers = new Set(answers);
        const validAnswers = answers.every((a: string) => ['A', 'B', 'C', 'D'].includes(a));
        
        if (!validAnswers) {
          errors.push('MMCQ correct_answer must be comma-separated list of A, B, C, D');
        }
        if (uniqueAnswers.size !== answers.length) {
          errors.push('MMCQ correct_answer cannot have duplicate options');
        }
      }
    } else if (row.question_type === 'Numeric') {
      // Numeric questions should not have options
      if (row.option_a || row.option_b || row.option_c || row.option_d) {
        errors.push('Numeric questions should not have options');
      }
      
      // Answer must be numeric
      const numericAnswer = parseFloat(row.correct_answer);
      if (isNaN(numericAnswer)) {
        errors.push('Numeric answer must be a valid number');
      }
    }

    if (errors.length > 0) {
      result.invalidTags.push({ row: i + 2, errors }); // i + 2 because row 1 is headers
      continue;
    }

    // Track duplicate groups for this row
    const duplicatesOfThisRow: number[] = [];
    
    // Check for duplicates in CSV
    for (let j = i + 1; j < csvData.length; j++) {
      const similar = findSimilarQuestions(
        row.question_text,
        [{ question_text: csvData[j].question_text } as Question],
        0.7
      );
      if (similar.length > 0) {
        duplicatesOfThisRow.push(j);
      }
    }

    // If duplicates found, add to groups
    if (duplicatesOfThisRow.length > 0) {
      result.duplicatesInCsv.push({
        keptRow: i + 2,
        skippedRows: duplicatesOfThisRow.map(r => r + 2),
        similarity: findSimilarQuestions(
          row.question_text,
          [{ question_text: csvData[duplicatesOfThisRow[0]].question_text } as Question],
          0.7
        )[0].similarity
      });
    }

    // Check for duplicates in system
    const systemDuplicates = findSimilarQuestions(
      row.question_text,
      existingQuestions,
      0.7
    );
    if (systemDuplicates.length > 0) {
      result.duplicatesInSystem.push({
        row: i + 2,
        questionId: systemDuplicates[0].question.id,
        similarity: systemDuplicates[0].similarity
      });
      continue;
    }

    // Skip if this row is a duplicate of a previous row
    const isSkippedDuplicate = result.duplicatesInCsv.some(
      group => group.skippedRows.includes(i + 2)
    );

    // Add to valid questions if not a system duplicate and not a skipped duplicate
    if (!isSkippedDuplicate) {
      result.validQuestions.push(convertRowToQuestion(row));
    }
  }

  return result;
};

export const QuestionBulkUploader: React.FC<QuestionBulkUploaderProps> = ({
  questions,
  tagSystem,
  onImport,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isImported, setIsImported] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setValidationResult(null);
    setIsImported(false);

    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const validation = await validateCsv(results.data, questions, tagSystem);
          setValidationResult(validation);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error processing file');
        }
      },
      error: (error) => {
        setError(`Error reading file: ${error.message}`);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = [
      'exam_type', 'subject', 'chapter', 'topic', 'difficulty_level',
      'question_type', 'source', 'question_text', 'question_image_url',
      'option_a', 'a_image_url', 'option_b', 'b_image_url',
      'option_c', 'c_image_url', 'option_d', 'd_image_url',
      'correct_answer', 'explanation', 'explanation_image_url'
    ];

    // Example rows
    const examples = [
      // MCQ example
      `JEE,Physics,Mechanics,Newton's Laws,Medium,MCQ,Reference Books,"What is F=ma?",,Option A,,Option B,,Option C,,Option D,,A,Newton's Second Law`,
      // Numeric example
      `JEE,Physics,Mechanics,Work Energy,Medium,Numeric,Reference Books,"Calculate force",,,,,,,,9.81,Force = mass * acceleration`,
      // MMCQ example
      `JEE,Physics,Mechanics,Newton's Laws,Medium,MMCQ,Reference Books,"Select all that apply",,Option A,,Option B,,Option C,,Option D,,A;C;D,Multiple correct options`
    ];

    const csvContent = headers.join(',') + '\n' + examples.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Bulk Upload Questions</h2>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download Template
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Template includes examples for MCQ, Numeric, and MMCQ questions.
              For Numeric questions, leave options empty and provide a numeric answer.
              For MMCQ questions, provide all options and comma-separated correct answers (e.g., A,C,D).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Questions CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          {validationResult && (
            <div className="space-y-4">
              {/* Invalid Tags */}
              {validationResult.invalidTags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-red-800 font-medium mb-2">Invalid Questions:</h4>
                  <div className="space-y-2">
                    {validationResult.invalidTags.map(({ row, errors }, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <p className="font-medium">Row {row}:</p>
                        <ul className="list-disc list-inside ml-4">
                          {errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates in CSV */}
              {validationResult.duplicatesInCsv.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-yellow-800 font-medium mb-2">Duplicate Questions in CSV:</h4>
                  <div className="space-y-2">
                    {validationResult.duplicatesInCsv.map((dup, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        <p>
                          <span className="font-medium">Keeping row {dup.keptRow}</span>
                        </p>
                        <p className="ml-4">
                          Skipping duplicate rows: {dup.skippedRows.join(', ')} 
                          ({Math.round(dup.similarity * 100)}% similar)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates in System */}
              {validationResult.duplicatesInSystem.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-yellow-800 font-medium mb-2">Questions Similar to Existing:</h4>
                  <div className="space-y-1">
                    {validationResult.duplicatesInSystem.map((dup, index) => (
                      <p key={index} className="text-sm text-yellow-700">
                        Row {dup.row} ({Math.round(dup.similarity * 100)}% similar to existing question)
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Questions Summary */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800">
                  {validationResult.validQuestions.length} questions ready to import
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* Import Button */}
              {validationResult.validQuestions.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      onImport(validationResult.validQuestions);
                      setSuccess(`Successfully imported ${validationResult.validQuestions.length} questions`);
                      setIsImported(true);
                    }}
                    disabled={isImported}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isImported 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    {isImported ? 'Questions Imported' : `Import ${validationResult.validQuestions.length} Questions`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
