import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize MathJax
declare global {
  interface Window {
    MathJax: any;
  }
}

window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
  svg: {
    fontCache: 'global',
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
  },
};

// Load MathJax
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
script.async = true;
document.head.appendChild(script);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
