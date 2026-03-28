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

  const scale = interpolate(progress, [0, 1], [1, config.scale]);
  const translateX = interpolate(progress, [0, 1], [0, -(config.x - 50) * 0.5]);
  const translateY = interpolate(progress, [0, 1], [0, -(config.y - 50) * 0.5]);

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
