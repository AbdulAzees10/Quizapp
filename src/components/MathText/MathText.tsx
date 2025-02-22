import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  text: string;
}

export function MathText({ text }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax) {
      window.MathJax.typesetClear([containerRef.current]);
      window.MathJax.typesetPromise([containerRef.current]).catch((err: any) =>
        console.error('MathJax typesetting failed:', err)
      );
    }
  }, [text]);

  return (
    <div ref={containerRef} className="math-text">
      {text}
    </div>
  );
}
