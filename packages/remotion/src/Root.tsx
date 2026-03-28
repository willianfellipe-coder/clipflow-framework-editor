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

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelComposition"
        component={Reel}
        durationInFrames={30 * 30}
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
        durationInFrames={30 * 30}
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
        durationInFrames={30 * 30}
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
        durationInFrames={30 * 30}
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
