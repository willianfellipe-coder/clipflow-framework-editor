import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ZoomConfig {
  scale: number;
  x: number;   // 0-100 percentage
  y: number;   // 0-100 percentage
  easing?: 'linear' | 'ease-in' | 'ease-out';
}

interface ZoomEffectProps {
  config?: ZoomConfig | null;
  children: React.ReactNode;
}

export const ZoomEffect: React.FC<ZoomEffectProps> = ({ config, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!config || config.scale === 1) {
    return <>{children}</>;
  }

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // BUG-003: Compensate translate by (scale - 1) factor
  const scale = interpolate(progress, [0, 1], [1, config.scale]);
  const scaleFactor = scale - 1;
  const translateX = interpolate(progress, [0, 1], [0, -(config.x - 50) * scaleFactor * 0.02]);
  const translateY = interpolate(progress, [0, 1], [0, -(config.y - 50) * scaleFactor * 0.02]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  );
};
