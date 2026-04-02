import React from 'react';
import { Composition } from 'remotion';
import { ReelComposition } from './compositions/ReelComposition';
import { FeedComposition } from './compositions/FeedComposition';
import { StoryComposition } from './compositions/StoryComposition';

const defaultCaptionStyle = {
  fontFamily: 'Inter',
  fontSize: 48,
  fontWeight: '800',
  color: '#FFFFFF',
  highlightColor: '#FFD700',
  strokeColor: '#000000',
  strokeWidth: 4,
  position: 'bottom' as const,
  maxWordsPerLine: 4,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Reel = ReelComposition as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Feed = FeedComposition as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Story = StoryComposition as React.FC<any>;

/**
 * BUG-001 fix: compute real durationInFrames from scenes or captions.
 * Previously hardcoded at 30*60 = 1800 frames (60s), silently truncating longer videos.
 */
const FPS = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcDuration(props: any): number {
  // Prefer last scene endTime (most accurate)
  if (Array.isArray(props.scenes) && props.scenes.length > 0) {
    const lastEnd = Math.max(...props.scenes.map((s: { endTime: number }) => s.endTime));
    if (lastEnd > 0) return Math.ceil(lastEnd * FPS) + FPS; // +1s tail buffer
  }
  // Fall back to last caption word timestamp
  if (Array.isArray(props.captions) && props.captions.length > 0) {
    const lastEnd = Math.max(...props.captions.map((c: { end: number }) => c.end));
    if (lastEnd > 0) return Math.ceil(lastEnd * FPS) + FPS;
  }
  // Absolute fallback: 60s (preview mode only)
  return 60 * FPS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateMetadata = ({ props }: { props: any; [key: string]: unknown }) => ({
  durationInFrames: calcDuration(props),
});

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelComposition"
        component={Reel}
        calculateMetadata={calculateMetadata}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoSrc: '',
          scenes: [],
          captions: [],
          captionStyle: defaultCaptionStyle,
          captionAnimation: 'word-highlight',
          showProgressBar: true,
        }}
      />

      <Composition
        id="FeedComposition"
        component={Feed}
        calculateMetadata={calculateMetadata}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          videoSrc: '',
          captions: [],
          captionStyle: defaultCaptionStyle,
          letterbox: true,
        }}
      />

      <Composition
        id="FeedComposition4x5"
        component={Feed}
        calculateMetadata={calculateMetadata}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={{
          videoSrc: '',
          captions: [],
          captionStyle: defaultCaptionStyle,
        }}
      />

      <Composition
        id="StoryComposition"
        component={Story}
        calculateMetadata={calculateMetadata}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoSrc: '',
          captions: [],
          captionStyle: defaultCaptionStyle,
          safeAreaTop: 120,
          safeAreaBottom: 200,
        }}
      />
    </>
  );
};
