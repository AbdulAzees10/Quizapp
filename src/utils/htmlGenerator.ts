import katex from 'katex';
import { Quiz } from '../types';

const PRINT_STYLES = `
  @page {
    size: A4;
    margin: 2.5cm 1.5cm;
    @top-center {
      content: "";
      margin: 1cm 0;
    }
    @bottom-center {
      content: "";
      margin: 1cm 0;
    }
  }

  body {
    font-family: "Times New Roman", serif;
    line-height: 1.5;
    color: #000;
    margin: 0;
    padding: 0;
    position: relative;
    min-height: 100vh;
    counter-reset: page;
  }

  .page {
    counter-increment: page;
    position: relative;
    page-break-after: always;
  }

  /* Watermark */
  .watermark {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    pointer-events: none;
  }

  .watermark::before {
    content: "PROF.P.C.THOMAS CLASSES\\A &\\A CHAITHANYA CLASSES";
    transform: rotate(-45deg);
    font-size: 48px;
    color: rgba(204, 204, 204, 0.5);
    white-space: pre;
    text-align: center;
    font-weight: 300;
    letter-spacing: 2px;
    line-height: 1.5;
  }

  .container {
    max-width: 210mm;
    margin: 0 auto;
    padding: 0;
    position: relative;
    z-index: 2;
  }

  @media screen {
    .container {
      padding: 2.5cm 1.5cm;
    }
  }

  .page-content {
    min-height: 297mm;
    position: relative;
    padding: 2.5cm 1.5cm;
    margin: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .page-content > * {
    position: relative;
    z-index: 2;
  }

  .page-content > *:not(main) {
    margin-bottom: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #000;
  }

  .institute-name {
    font-size: 15pt;
    font-weight: bold;
    margin: 0 0 1rem 0;
    letter-spacing: 0.5px;
  }

  .test-title {
    font-size: 13pt;
    font-weight: bold;
    margin: 0 0 1rem 0;
  }

  .quiz-meta {
    font-size: 11pt;
    display: flex;
    justify-content: center;
    gap: 3rem;
    color: #333;
  }

  /* Instructions */
  .instructions {
    margin: 2rem 0;
    padding: 1rem;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    page-break-inside: avoid;
  }

  .instructions ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  .instructions li {
    font-size: 11pt;
    line-height: 1.4;
    margin: 0.5rem 0;
  }

  /* Two-column layout */
  main {
    column-count: 2;
    column-gap: 2.5rem;
    margin: 0;
    padding: 2.5cm 1.5cm;
    page-break-before: always;
    min-height: calc(100vh - 5cm);
  }

  .section {
    break-inside: avoid;
    margin-bottom: 2.5rem;
  }

  .section-header {
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 13pt;
    font-weight: bold;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
  }

  .section-info {
    font-size: 10.5pt;
    margin-bottom: 1.25rem;
    color: #333;
  }

  .question {
    break-inside: avoid;
    margin-bottom: 2rem;
    font-size: 11pt;
  }

  .question-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .question-number {
    font-weight: bold;
    min-width: 1.25rem;
  }

  .question-content {
    margin-left: 1.25rem;
  }

  .question-text {
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .options {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-left: 0.25rem;
  }

  .option {
    display: flex;
    gap: 0.75rem;
    break-inside: avoid;
    line-height: 1.4;
  }

  .option-label {
    font-weight: bold;
    min-width: 1rem;
  }

  .option-content {
    flex: 1;
    padding-right: 1rem;
  }

  img {
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
    margin: 0.5rem 0;
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 1.5cm;
    border-top: 1px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 10pt;
    background: white;
    z-index: 2;
  }

  .footer-address {
    font-family: "Times New Roman", serif;
    white-space: pre-line;
    line-height: 1.4;
    text-align: left;
    font-weight: 500;
    font-size: 9.5pt;
    color: #000;
  }

  .page-number {
    margin-left: auto;
    font-size: 9pt;
    color: #666;
    padding-top: 0.25rem;
  }

  @page {
    @bottom-right {
      content: "Page " counter(page);
      font-family: "Times New Roman", serif;
      font-size: 9pt;
      margin: 1cm 1.5cm;
    }
  }

  @media print {
    .footer {
      display: none;
    }
  }

  @media print {
    .container {
      max-width: none;
    }

    /* Ensure proper page breaks */
    .section {
      page-break-before: auto;
      page-break-after: auto;
    }

    .question {
      page-break-inside: avoid;
    }

    /* Ensure proper font rendering */
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Ensure math renders properly */
    .katex {
      font-size: inherit !important;
    }
  }
`;

// Function to render math expressions
const renderMath = (text: string): string => {
  return text.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/).map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try {
        return katex.renderToString(part.slice(2, -2), { displayMode: true });
      } catch (error) {
        console.error('KaTeX error:', error);
        return part;
      }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try {
        return katex.renderToString(part.slice(1, -1), { displayMode: false });
      } catch (error) {
        console.error('KaTeX error:', error);
        return part;
      }
    }
    return part;
  }).join('');
};

interface GenerateHtmlOptions {
  quiz: Quiz;
  instituteDetails: {
    name: string;
    logo?: string;
    address: string;
  };
  testDetails: {
    title: string;
  };
}

export const generateHtml = ({
  quiz,
  instituteDetails,
  testDetails,
}: GenerateHtmlOptions): string => {
  const questionsHtml = quiz.sections.map((section, sectionIndex) => `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">${section.name}</h3>
        <div class="section-info">
          ${section.duration ? `Time: ${section.duration} minutes<br>` : ''}
          Marks per question: ${section.marks}
        </div>
      </div>

      <div class="questions">
        ${section.questions.map((question, questionIndex) => `
          <div class="question">
            <div class="question-header">
              <span class="question-number">${questionIndex + 1}.</span>
            </div>

            <div class="question-content">
              <div class="question-text">
                ${renderMath(question.question_text)}
              </div>

              ${question.image_url ? `
                <img src="${question.image_url}" alt="Question" class="question-image" />
              ` : ''}

              ${question.tags.question_type !== 'Numeric' ? `
                <div class="options">
                  ${['A', 'B', 'C', 'D'].map(letter => {
                    const optionKey = `option_${letter.toLowerCase()}`;
                    const imageUrlKey = `${optionKey}_image_url`;
                    const optionText = question[optionKey as keyof typeof question] as string;
                    const imageUrl = question[imageUrlKey as keyof typeof question] as string | undefined;

                    return `
                      <div class="option">
                        <span class="option-label">${letter}.</span>
                        <div class="option-content">
                          ${renderMath(optionText)}
                          ${imageUrl ? `
                            <img src="${imageUrl}" alt="Option ${letter}" class="option-image" />
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${testDetails.title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="page">
          <div class="watermark"></div>
          <div class="page-content">
            <header class="header">
              <h1 class="institute-name">${instituteDetails.name}</h1>
              <h2 class="test-title">${testDetails.title}</h2>
              <div class="quiz-meta">
                <div>Total Marks: ${quiz.totalMarks}</div>
                <div>Duration: ${quiz.totalDuration} minutes</div>
              </div>
            </header>

            ${quiz.instructions?.length ? `
              <div class="instructions">
                <ul>
                  ${quiz.instructions.map((instruction, index) => `
                    <li>${index + 1}. ${instruction}</li>
                  `).join('')}
                </ul>
              </div>
            ` : `
              <div class="instructions">
                <ul>
                  <li>1. All questions are compulsory</li>
                  <li>2. Each question carries equal marks</li>
                  <li>3. Write your answers in the space provided</li>
                </ul>
              </div>
            `}
          </div>
        </div>

        <div class="page">
          <div class="watermark"></div>
          <div class="page-content">
            <main>
              ${questionsHtml}
            </main>
          </div>
        </div>

        <footer class="footer">
          <div class="footer-address">${instituteDetails.address}</div>
          <span class="page-number"></span>
        </footer>
      </div>
    </body>
    </html>
  `;
};
