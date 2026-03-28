import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionStyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  position: 'top' | 'center' | 'bottom';
  maxWordsPerLine: number;
}

interface AnimatedCaptionProps {
  words: CaptionWord[];
  style: CaptionStyleConfig;
}

/** Word-by-word highlight: active word changes color */
export const AnimatedCaption: React.FC<AnimatedCaptionProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find visible words (within a window around current time)
  const visibleWords = words.filter(
    (w) => currentTime >= w.start - 0.1 && currentTime <= w.end + 2,
  );

  // Group into lines
  const lines: CaptionWord[][] = [];
  for (let i = 0; i < visibleWords.length; i += style.maxWordsPerLine) {
    lines.push(visibleWords.slice(i, i + style.maxWordsPerLine));
  }

  // Only show last 2 lines
  const displayLines = lines.slice(-2);

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...(style.position === 'top' && { top: '10%' }),
    ...(style.position === 'center' && { top: '50%', transform: 'translateY(-50%)' }),
    ...(style.position === 'bottom' && { bottom: '12%' }),
  };

  return (
    <div style={positionStyle}>
      {displayLines.map((line, lineIdx) => (
        <div key={lineIdx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {line.map((word, wordIdx) => {
            const isActive = currentTime >= word.start && currentTime <= word.end;
            const opacity = interpolate(
              currentTime,
              [word.start - 0.15, word.start],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );

            return (
              <span
                key={`${lineIdx}-${wordIdx}`}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight as React.CSSProperties['fontWeight'],
                  color: isActive ? style.highlightColor : style.color,
                  WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
                  paintOrder: 'stroke fill',
                  opacity,
                  transition: 'color 0.1s',
                }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
