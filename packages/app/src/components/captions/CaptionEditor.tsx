import { useState, useCallback } from 'react';
import type { WordTimestamp, CaptionAnimation } from '@clip/shared';
import { CaptionStylePicker } from './CaptionStylePicker';
import { WordTimingAdjust } from './WordTimingAdjust';

interface CaptionEditorProps {
  words: WordTimestamp[];
  selectedWordIndex: number | null;
  captionAnimation: CaptionAnimation;
  onUpdateWord: (index: number, word: string) => void;
  onUpdateTiming: (index: number, start: number, end: number) => void;
  onAnimationChange: (animation: CaptionAnimation) => void;
}

export function CaptionEditor({
  words,
  selectedWordIndex,
  captionAnimation,
  onUpdateWord,
  onUpdateTiming,
  onAnimationChange,
}: CaptionEditorProps) {
  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

  return (
    <div className="space-y-4">
      <CaptionStylePicker selected={captionAnimation} onChange={onAnimationChange} />

      {selectedWord && selectedWordIndex !== null ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Edit Word</label>
            <input
              type="text"
              value={selectedWord.word}
              onChange={(e) => onUpdateWord(selectedWordIndex, e.target.value)}
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-2 py-1.5 text-sm"
            />
          </div>

          <WordTimingAdjust
            word={selectedWord}
            index={selectedWordIndex}
            onUpdate={onUpdateTiming}
          />

          {/* Context: surrounding words */}
          <div>
            <label className="text-[10px] text-muted-foreground">Context</label>
            <p className="mt-1 text-xs text-muted-foreground">
              {words
                .slice(Math.max(0, selectedWordIndex - 3), selectedWordIndex + 4)
                .map((w, i) => {
                  const absIdx = Math.max(0, selectedWordIndex - 3) + i;
                  return (
                    <span
                      key={absIdx}
                      className={absIdx === selectedWordIndex ? 'font-bold text-primary' : ''}
                    >
                      {w.word}{' '}
                    </span>
                  );
                })}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Select a word on the caption track to edit timing and text
        </p>
      )}
    </div>
  );
}
