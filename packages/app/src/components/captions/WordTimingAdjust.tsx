import { useState, useCallback } from 'react';
import type { WordTimestamp } from '@clip/shared';

interface WordTimingAdjustProps {
  word: WordTimestamp;
  index: number;
  onUpdate: (index: number, start: number, end: number) => void;
}

export function WordTimingAdjust({ word, index, onUpdate }: WordTimingAdjustProps) {
  const [start, setStart] = useState(word.start);
  const [end, setEnd] = useState(word.end);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0 && val < end) {
      setStart(val);
      onUpdate(index, val, end);
    }
  }, [index, end, onUpdate]);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > start) {
      setEnd(val);
      onUpdate(index, start, val);
    }
  }, [index, start, onUpdate]);

  return (
    <div className="rounded border border-border bg-card p-3">
      <p className="text-sm font-medium">"{word.word}"</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Start (s)</label>
          <input
            type="number"
            step="0.01"
            value={start.toFixed(3)}
            onChange={handleStartChange}
            className="mt-0.5 w-full rounded border border-border bg-zinc-900 px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">End (s)</label>
          <input
            type="number"
            step="0.01"
            value={end.toFixed(3)}
            onChange={handleEndChange}
            className="mt-0.5 w-full rounded border border-border bg-zinc-900 px-2 py-1 text-xs"
          />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Duration: {((end - start) * 1000).toFixed(0)}ms</span>
        {word.confidence !== undefined && (
          <span>Confidence: {(word.confidence * 100).toFixed(0)}%</span>
        )}
      </div>
    </div>
  );
}
