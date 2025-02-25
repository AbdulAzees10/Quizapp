import katex from 'katex';

export const renderMathText = (text: string): string => {
  try {
    // First, handle display mode math ($$...$$)
    let processedText = text.replace(/\$\$([^\$]+)\$\$/g, (match, math) => {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: true,
        output: 'htmlAndMathml',
        strict: false,
        trust: true,
        macros: {
          '\\V': '\\vec',
          '\\E': '\\vec{E}',
          '\\B': '\\vec{B}'
        }
      });
    });

    // Then handle inline math ($...$)
    processedText = processedText.replace(/\$([^\$]+)\$/g, (match, math) => {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
        output: 'htmlAndMathml',
        strict: false,
        trust: true,
        macros: {
          '\\V': '\\vec',
          '\\E': '\\vec{E}',
          '\\B': '\\vec{B}'
        }
      });
    });

    return processedText;
  } catch (error) {
    console.error('Math rendering error:', error);
    return text;
  }
}; 