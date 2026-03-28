import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CTAConfig {
  text: string;
  subtext?: string;
  duration: number;
  backgroundColor?: string;
  textColor?: string;
}

interface CallToActionProps {
  config: CTAConfig;
}

export const CallToAction: React.FC<CallToActionProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.8 },
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: config.backgroundColor || 'rgba(0,0,0,0.85)',
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <p
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: config.textColor || '#FFFFFF',
            margin: 0,
          }}
        >
          {config.text}
        </p>
        {config.subtext && (
          <p
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 16,
            }}
          >
            {config.subtext}
          </p>
        )}
      </div>
    </div>
  );
};
