import { useCallback, useRef } from 'react';

interface HistoryEntry<T> {
  state: T;
  label: string;
}

export function useUndoRedo<T>(initialState: T) {
  const historyRef = useRef<HistoryEntry<T>[]>([{ state: initialState, label: 'initial' }]);
  const indexRef = useRef(0);

  const push = useCallback((state: T, label: string) => {
    // Truncate any future states
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push({ state, label });
    indexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback((): T | null => {
    if (indexRef.current > 0) {
      indexRef.current--;
      return historyRef.current[indexRef.current].state;
    }
    return null;
  }, []);

  const redo = useCallback((): T | null => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      return historyRef.current[indexRef.current].state;
    }
    return null;
  }, []);

  const canUndo = useCallback(() => indexRef.current > 0, []);
  const canRedo = useCallback(() => indexRef.current < historyRef.current.length - 1, []);

  return { push, undo, redo, canUndo, canRedo };
}
