import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface ProgressBarProps {
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  color = '#6366F1',
  height = 4,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame / durationInFrames) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height,
        backgroundColor: 'rgba(255,255,255,0.2)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </div>
  );
};
