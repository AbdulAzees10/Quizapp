import React from 'react';
import { Quiz } from '../../types';
import { MathText } from '../MathText/MathText';

interface QuizPrintLayoutProps {
  quiz: Quiz;
  instituteDetails: {
    name: string;
    logo?: string;
    tagline?: string;
  };
  testDetails: {
    title: string;
    batch: string;
    date: string;
  };
}

export const QuizPrintLayout: React.FC<QuizPrintLayoutProps> = ({
  quiz,
  instituteDetails,
  testDetails,
}) => {
  return (
    <div className="quiz-print-layout">
      {/* Header */}
      <header className="print-header">
        <div className="header-content">
          <div className="institute-details">
            {instituteDetails.logo && (
              <img 
                src={instituteDetails.logo} 
                alt="Institute Logo" 
                className="institute-logo"
              />
            )}
            <h1 className="institute-name">{instituteDetails.name}</h1>
          </div>
          <div className="test-details">
            <h2 className="test-title">{testDetails.title}</h2>
            <div className="test-meta">
              <span className="batch">{testDetails.batch}</span>
              <span className="date">{testDetails.date}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Questions in two columns */}
      <main className="questions-container">
        {quiz.sections.map((section, sectionIndex) => (
          <div key={section.id} className="section">
            <div className="section-header">
              <h3 className="section-title">{section.name}</h3>
              {section.duration && (
                <span className="section-time">Time: {section.duration} minutes</span>
              )}
            </div>

            <div className="questions-grid">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">
                      {questionIndex + 1}.
                    </span>
                    <span className="question-marks">
                      [{section.marks} marks]
                    </span>
                  </div>

                  <div className="question-content">
                    <div className="question-text">
                      <MathText text={question.question_text} />
                    </div>

                    {question.image_url && (
                      <img 
                        src={question.image_url} 
                        alt="Question" 
                        className="question-image"
                      />
                    )}

                    <div className="options-grid">
                      <div className="option">
                        <span className="option-label">A.</span>
                        <div className="option-content">
                          <MathText text={question.option_a} />
                          {question.option_a_image_url && (
                            <img 
                              src={question.option_a_image_url} 
                              alt="Option A" 
                              className="option-image"
                            />
                          )}
                        </div>
                      </div>

                      <div className="option">
                        <span className="option-label">B.</span>
                        <div className="option-content">
                          <MathText text={question.option_b} />
                          {question.option_b_image_url && (
                            <img 
                              src={question.option_b_image_url} 
                              alt="Option B" 
                              className="option-image"
                            />
                          )}
                        </div>
                      </div>

                      <div className="option">
                        <span className="option-label">C.</span>
                        <div className="option-content">
                          <MathText text={question.option_c} />
                          {question.option_c_image_url && (
                            <img 
                              src={question.option_c_image_url} 
                              alt="Option C" 
                              className="option-image"
                            />
                          )}
                        </div>
                      </div>

                      <div className="option">
                        <span className="option-label">D.</span>
                        <div className="option-content">
                          <MathText text={question.option_d} />
                          {question.option_d_image_url && (
                            <img 
                              src={question.option_d_image_url} 
                              alt="Option D" 
                              className="option-image"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="print-footer">
        <div className="footer-content">
          <span className="page-number">Page 1</span>
          {instituteDetails.tagline && (
            <span className="tagline">{instituteDetails.tagline}</span>
          )}
        </div>
      </footer>
    </div>
  );
};
