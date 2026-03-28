import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CaptionWord, CaptionStyleConfig } from './AnimatedCaption';

interface KaraokeCaptionProps {
  words: CaptionWord[];
  style: CaptionStyleConfig;
}

/** Karaoke-style: progressive fill reveal left-to-right */
export const KaraokeCaption: React.FC<KaraokeCaptionProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const visibleWords = words.filter(
    (w) => currentTime >= w.start - 0.1 && currentTime <= w.end + 2,
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
            const fillProgress = interpolate(
              currentTime,
              [word.start, word.end],
              [0, 100],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );

            return (
              <span
                key={`${lineIdx}-${wordIdx}`}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight as React.CSSProperties['fontWeight'],
                  color: style.color,
                  WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
                  paintOrder: 'stroke fill',
                  background: `linear-gradient(90deg, ${style.highlightColor} ${fillProgress}%, ${style.color} ${fillProgress}%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
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
