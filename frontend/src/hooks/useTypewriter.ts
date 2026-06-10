// Path: src/hooks/useTypewriter.ts
// Purpose: Progressively reveals a string for typing animations
// Dependencies: react

import { useState, useEffect, useRef } from 'react';

export const useTypewriter = (text: string, speed = 30, startDelay = 0, trigger = true): string => {
  const [displayedText, setDisplayedText] = useState('');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!trigger || hasRunRef.current || !text) return;
    
    let interval: ReturnType<typeof setInterval>;

    hasRunRef.current = true;
    
    const timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, startDelay, trigger]);

  return displayedText;
};
