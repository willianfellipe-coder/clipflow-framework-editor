import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CaptionWord, CaptionStyleConfig } from './AnimatedCaption';

interface PopCaptionProps {
  words: CaptionWord[];
  style: CaptionStyleConfig;
}

/** Pop/bounce: each word pops in with spring animation */
export const PopCaption: React.FC<PopCaptionProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const visibleWords = words.filter(
    (w) => currentTime >= w.start - 0.05 && currentTime <= w.end + 2,
  );

  const lines: CaptionWord[][] = [];
  for (let i = 0; i < visibleWords.length; i += style.maxWordsPerLine) {
    lines.push(visibleWords.slice(i, i + style.maxWordsPerLine));
  }

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
            const wordFrame = Math.round(word.start * fps);
            const isActive = currentTime >= word.start && currentTime <= word.end;

            const scale = spring({
              frame: frame - wordFrame,
              fps,
              config: { damping: 12, stiffness: 200, mass: 0.5 },
            });

            const opacity = interpolate(
              frame - wordFrame,
              [0, 3],
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
                  transform: `scale(${scale})`,
                  opacity,
                  display: 'inline-block',
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
