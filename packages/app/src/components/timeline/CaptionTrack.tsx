import { cn } from '@/lib/utils';
import type { WordTimestamp } from '@clip/shared';

interface CaptionTrackProps {
  words: WordTimestamp[];
  pixelsPerSecond: number;
  selectedWordIndex: number | null;
  onSelectWord: (index: number) => void;
}

export function CaptionTrack({ words, pixelsPerSecond, selectedWordIndex, onSelectWord }: CaptionTrackProps) {
  return (
    <>
      {words.map((word, i) => {
        const left = word.start * pixelsPerSecond;
        const width = Math.max(4, (word.end - word.start) * pixelsPerSecond);

        return (
          <button
            key={i}
            onClick={() => onSelectWord(i)}
            className={cn(
              'absolute top-1 bottom-1 rounded text-[9px] overflow-hidden px-0.5 transition-colors',
              'bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/40',
              selectedWordIndex === i && 'ring-1 ring-indigo-400 bg-indigo-500/40',
            )}
            style={{ left, width }}
            title={`"${word.word}" ${word.start.toFixed(2)}s-${word.end.toFixed(2)}s`}
          >
            {width > 20 && word.word}
          </button>
        );
      })}
    </>
  );
}
