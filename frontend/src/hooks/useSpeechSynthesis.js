import { useCallback } from 'react';

export function useSpeechSynthesis() {
  const speak = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new window.SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);
  return { speak };
}
