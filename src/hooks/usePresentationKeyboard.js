import { useEffect } from 'react';
import { shouldIgnoreShortcut } from '../navigation';

export default function usePresentationKeyboard({ disabled, onNavigate, onFullscreen }) {
  useEffect(() => {
    const keydown = event => {
      if (disabled || event.repeat || shouldIgnoreShortcut(event)) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        onNavigate(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        onFullscreen();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [disabled, onNavigate, onFullscreen]);
}
