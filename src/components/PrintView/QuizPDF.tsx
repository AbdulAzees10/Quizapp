import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Quiz } from '../../types';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Register KaTeX fonts for PDF rendering
const styles = StyleSheet.create({
  page: {
    padding: '15mm',
    fontFamily: 'Times-Roman',
    fontSize: 10,
    position: 'relative',
  },
  header: {
    marginBottom: '10mm',
    textAlign: 'center',
  },
  instituteName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: '3mm',
  },
  physics: {
    fontSize: 11,
    marginBottom: '2mm',
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '15mm',
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    marginBottom: '8mm',
    marginTop: '8mm',
    fontWeight: 'bold',
    width: '100%',
  },
  questionContainer: {
    marginBottom: '8mm',
  },
  question: {
    flexDirection: 'row',
    marginBottom: '3mm',
  },
  questionNumber: {
    width: '15pt',
    marginRight: '5pt',
  },
  questionContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionsGrid: {
    marginLeft: '20pt',
    marginTop: '2mm',
  },
  option: {
    flexDirection: 'row',
    marginBottom: '2mm',
  },
  optionLabel: {
    width: '15pt',
  },
  optionContent: {
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 10,
    color: 'grey',
  },
  footer: {
    position: 'absolute',
    bottom: '25mm',
    left: '30pt',
    right: '30pt',
    textAlign: 'center',
    fontSize: 8,
    paddingRight: '40pt',
  },
  mathEquation: {
    fontFamily: 'KaTeX_Main',
    lineHeight: 1.5,
    fontSize: 10,
  },
  displayMathEquation: {
    marginVertical: 8,
    textAlign: 'center',
    fontSize: 12,
    paddingLeft: 20,
    paddingRight: 20,
  },
  mathError: {
    color: 'red',
    fontStyle: 'italic',
    fontSize: 10,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '20%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 20,
    color: 'red',
    opacity: 0.1,
    zIndex: -1,
  },
});

// Function to render LaTeX to SVG using KaTeX
const renderLatexToSvg = (latex: string, displayMode: boolean = false): string => {
  try {
    return katex.renderToString(latex, {
      displayMode,
      output: 'svg',
      throwOnError: false,
    });
  } catch (error) {
    console.error('Error rendering LaTeX:', error);
    return `<span style="color: red;">LaTeX Error: ${latex}</span>`;
  }
};

// Function to render LaTeX content in the PDF
const renderMathContent = (text: string) => {
  if (!text) return null;

  return text.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/).map((part, index) => {
    if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('$') && part.endsWith('$'))) {
      const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(1, -1);
      const displayMode = part.startsWith('$$');
      const svg = renderLatexToSvg(math, displayMode);

      return (
        <Image
          key={index}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
          style={displayMode ? styles.displayMathEquation : styles.mathEquation}
        />
      );
    }
    return <Text key={index}>{part}</Text>;
  });
};

interface QuizPDFProps {
  quiz: Quiz;
  instituteDetails: {
    name: string;
    tagline: string;
  };
  testDetails: {
    title: string;
    batch: string;
    date: string;
  };
}

export function QuizPDF({ quiz, instituteDetails, testDetails }: QuizPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.instituteName}>{instituteDetails.name}</Text>
          <Text style={styles.physics}>{quiz.title} - {quiz.createdAt.split('T')[0].split('-').reverse().join('-')}</Text>
          <Text style={styles.physics}>Instructions: </Text>
          {quiz.instructions?.map((item, index) => (
            <Text style={styles.physics} key={index}>{item}</Text>
          ))}
        </View>

        {/* Questions */}
        {quiz.sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={styles.sectionTitle}>
              {section.name} ({section.marks} marks each)
            </Text>
            <View style={styles.contentContainer}>
              {/* Left Column */}
              <View style={styles.column}>
                {section.questions.slice(0, Math.ceil(section.questions.length / 2)).map((question, questionIndex) => (
                  <View key={questionIndex} style={styles.questionContainer}>
                    <View style={styles.question}>
                      <Text style={styles.questionNumber}>{questionIndex + 1}.</Text>
                      <View style={styles.questionContent}>
                        {renderMathContent(question.question_text)}
                        {question.image_url && (
                          <Image
                            src={question.image_url}
                            style={{ maxWidth: '150pt', marginTop: '3mm' }}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {section.questions.slice(Math.ceil(section.questions.length / 2)).map((question, questionIndex) => (
                  <View key={questionIndex} style={styles.questionContainer}>
                    <View style={styles.question}>
                      <Text style={styles.questionNumber}>{Math.ceil(section.questions.length / 2) + questionIndex + 1}.</Text>
                      <View style={styles.questionContent}>
                        {renderMathContent(question.question_text)}
                        {question.image_url && (
                          <Image
                            src={question.image_url}
                            style={{ maxWidth: '150pt', marginTop: '3mm' }}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View fixed style={styles.footer}>
          <Text>{instituteDetails.tagline}</Text>
        </View>
      </Page>
    </Document>
  );
}