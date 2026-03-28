import React from 'react';
import { AbsoluteFill, Video } from 'remotion';
import { AnimatedCaption, type CaptionWord, type CaptionStyleConfig } from '../components/AnimatedCaption';

export interface StoryProps {
  videoSrc: string;
  captions: CaptionWord[];
  captionStyle: CaptionStyleConfig;
  safeAreaTop?: number;
  safeAreaBottom?: number;
}

/** Story composition: 9:16 with safe areas for story UI elements */
export const StoryComposition: React.FC<StoryProps> = ({
  videoSrc,
  captions,
  captionStyle,
  safeAreaTop = 120,
  safeAreaBottom = 200,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video
        src={videoSrc}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Safe area overlay guides (semi-transparent) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: safeAreaTop,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: safeAreaBottom,
          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
        }}
      />

      {/* Captions positioned within safe area */}
      {captions.length > 0 && (
        <AbsoluteFill style={{ top: safeAreaTop, bottom: safeAreaBottom }}>
          <AnimatedCaption
            words={captions}
            style={{ ...captionStyle, position: 'bottom' }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
