import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CaptionWord, CaptionStyleConfig } from './AnimatedCaption';

interface GlowCaptionProps {
  words: CaptionWord[];
  style: CaptionStyleConfig;
}

/** Glow: neon glow effect on the active word */
export const GlowCaption: React.FC<GlowCaptionProps> = ({ words, style }) => {
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
            const isActive = currentTime >= word.start && currentTime <= word.end;

            const glowIntensity = isActive
              ? interpolate(
                  currentTime,
                  [word.start, (word.start + word.end) / 2, word.end],
                  [0, 1, 0.6],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                )
              : 0;

            const opacity = interpolate(
              currentTime,
              [word.start - 0.15, word.start],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );

            const glowColor = style.highlightColor;
            const blur = Math.round(glowIntensity * 20);

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
                  textShadow: isActive
                    ? `0 0 ${blur}px ${glowColor}, 0 0 ${blur * 2}px ${glowColor}`
                    : 'none',
                  opacity,
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
