import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onPlayPause?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onSplit?: () => void;
  onSeekBack?: () => void;
  onSeekForward?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const ctrl = e.ctrlKey || e.metaKey;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        handlers.onPlayPause?.();
        break;
      case 'z':
        if (ctrl) { e.preventDefault(); handlers.onUndo?.(); }
        break;
      case 'y':
        if (ctrl) { e.preventDefault(); handlers.onRedo?.(); }
        break;
      case 'Delete':
      case 'Backspace':
        if (!ctrl) handlers.onDelete?.();
        break;
      case 's':
        if (!ctrl) handlers.onSplit?.();
        break;
      case 'j':
        handlers.onSeekBack?.();
        break;
      case 'k':
        handlers.onPlayPause?.();
        break;
      case 'l':
        handlers.onSeekForward?.();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
