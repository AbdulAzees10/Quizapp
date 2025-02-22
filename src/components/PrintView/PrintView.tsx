import React, { useEffect } from 'react';
import { Quiz, Question } from '../../types';
import { MathText } from '../MathText/MathText';
import 'katex/dist/katex.min.css';
import './PrintView.css';

interface PrintViewProps {
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

export const PrintView: React.FC<PrintViewProps> = ({
  quiz,
  instituteDetails,
  testDetails,
}) => {
  // Auto-print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000); // Give time for styles and math to render

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-view">
      {/* Header */}
      <header className="header">
        <h1 className="institute-name">{instituteDetails.name}</h1>
        <h2 className="test-title">{testDetails.title}</h2>
        <div className="test-meta">
          <span className="batch">{testDetails.batch}</span>
          <span className="date">{testDetails.date}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {quiz.sections.map((section, sectionIndex) => (
          <div key={section.id} className="section">
            <div className="section-header">
              <h3>{section.name}</h3>
              {section.duration && (
                <span>Time: {section.duration} minutes</span>
              )}
            </div>

            <div className="questions">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="question">
                  <div className="question-header">
                    <span className="question-number">
                      {questionIndex + 1}.
                    </span>
                    <span className="marks">
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

                    <div className="options">
                      {['A', 'B', 'C', 'D'].map((letter) => {
                        const optionKey = `option_${letter.toLowerCase()}`;
                        const imageUrlKey = `${optionKey}_image_url`;
                        const optionText = question[optionKey as keyof Question] as string;
                        const imageUrl = question[imageUrlKey as keyof Question] as string | undefined;
                        
                        return (
                          <div key={letter} className="option">
                            <span className="option-label">{letter}.</span>
                            <div className="option-content">
                              <MathText text={optionText} />
                              {imageUrl && (
                                <img 
                                  src={imageUrl} 
                                  alt={`Option ${letter}`} 
                                  className="option-image"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="footer">
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
