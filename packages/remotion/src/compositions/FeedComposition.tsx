import React from 'react';
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCaption, type CaptionWord, type CaptionStyleConfig } from '../components/AnimatedCaption';
import { ProgressBar } from '../components/ProgressBar';

export interface FeedProps {
  videoSrc: string;
  captions: CaptionWord[];
  captionStyle: CaptionStyleConfig;
  letterbox?: boolean;
}

/** Feed composition: 1:1 or 4:5 with optional letterboxing */
export const FeedComposition: React.FC<FeedProps> = ({
  videoSrc,
  captions,
  captionStyle,
  letterbox = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Video centered with letterbox */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Video
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: letterbox ? 'contain' : 'cover',
          }}
        />
      </div>

      {/* Captions */}
      {captions.length > 0 && (
        <AbsoluteFill>
          <AnimatedCaption words={captions} style={captionStyle} />
        </AbsoluteFill>
      )}

      <ProgressBar />
    </AbsoluteFill>
  );
};
