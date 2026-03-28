import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface TransitionProps {
  type: string;
  duration?: number;  // seconds
  children: React.ReactNode;
}

export const Transition: React.FC<TransitionProps> = ({
  type,
  duration = 0.3,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const transitionFrames = Math.round(duration * fps);

  // Fade in at start
  const fadeIn = interpolate(frame, [0, transitionFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - transitionFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const opacity = Math.min(fadeIn, fadeOut);

  if (type === 'cut') {
    return <>{children}</>;
  }

  if (type === 'fade') {
    return <div style={{ opacity }}>{children}</div>;
  }

  if (type === 'slide') {
    const slideIn = interpolate(frame, [0, transitionFrames], [100, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <div style={{ transform: `translateX(${slideIn}%)`, opacity: fadeOut }}>
        {children}
      </div>
    );
  }

  if (type === 'zoom') {
    const scaleIn = interpolate(frame, [0, transitionFrames], [1.3, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <div style={{ transform: `scale(${scaleIn})`, opacity }}>{children}</div>
    );
  }

  // Default: fade
  return <div style={{ opacity }}>{children}</div>;
};
