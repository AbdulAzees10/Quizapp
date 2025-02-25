import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MathText.css';

interface MathTextProps {
  text: string;
}

export function MathText({ text }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderMath = (text: string): string => {
    try {
      return text.replace(/\$(.*?)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false,
            strict: false
          });
        } catch (err) {
          console.warn('KaTeX rendering error:', err);
          return match; // Return original text if rendering fails
        }
      });
    } catch (err) {
      console.warn('Math processing error:', err);
      return text; // Return original text if processing fails
    }
  };

  useEffect(() => {
    let isMounted = true;

    const processMath = async () => {
      if (!containerRef.current || !isMounted) return;

      try {
        if (window.MathJax) {
          await window.MathJax.typesetPromise([containerRef.current]);
        }
      } catch (err) {
        console.warn('MathJax processing error:', err);
      }
    };

    processMath();

    return () => {
      isMounted = false;
    };
  }, [text]);

  return (
    <div ref={containerRef} className="math-text">
      <span
        dangerouslySetInnerHTML={{
          __html: renderMath(text)
        }}
      />
    </div>
  );
}
