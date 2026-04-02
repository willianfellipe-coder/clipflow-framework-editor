import React from 'react';
import { AbsoluteFill, Sequence, Video, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCaption, type CaptionWord, type CaptionStyleConfig } from '../components/AnimatedCaption';
import { KaraokeCaption } from '../components/KaraokeCaption';
import { PopCaption } from '../components/PopCaption';
import { GlowCaption } from '../components/GlowCaption';
import { ZoomEffect, type ZoomConfig } from '../components/ZoomEffect';
import { Transition } from '../components/Transition';
import { ProgressBar } from '../components/ProgressBar';
import { CallToAction, type CTAConfig } from '../components/CallToAction';
import { secondsToFrames } from '../utils/timing';

export interface SceneData {
  id: string;
  startTime: number;
  endTime: number;
  type: string;
  transitionIn?: string;
  transitionOut?: string;
  zoomConfig?: ZoomConfig | null;
}

export interface ReelProps {
  videoSrc: string;
  scenes: SceneData[];
  captions: CaptionWord[];
  captionStyle: CaptionStyleConfig;
  captionAnimation?: 'word-highlight' | 'karaoke' | 'pop' | 'glow' | 'none';
  showProgressBar?: boolean;
  cta?: CTAConfig;
}

export const ReelComposition: React.FC<ReelProps> = ({
  videoSrc,
  scenes,
  captions,
  captionStyle,
  captionAnimation = 'word-highlight',
  showProgressBar = true,
  cta,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const CaptionComponent = {
    'word-highlight': AnimatedCaption,
    'karaoke': KaraokeCaption,
    'pop': PopCaption,
    'glow': GlowCaption,
    'none': null,
  }[captionAnimation];

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Video layer with scenes */}
      {scenes.map((scene) => {
        const from = secondsToFrames(scene.startTime, fps);
        const dur = secondsToFrames(scene.endTime, fps) - from;
        if (dur <= 0) return null;

        return (
          <Sequence key={scene.id} from={from} durationInFrames={dur}>
            <Transition type={scene.transitionIn || 'cut'}>
              <ZoomEffect config={scene.zoomConfig}>
                <Video
                  src={videoSrc}
                  startFrom={from}
                  endAt={from + dur}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </ZoomEffect>
            </Transition>
          </Sequence>
        );
      })}

      {/* If no scenes, show full video */}
      {scenes.length === 0 && videoSrc && (
        <Video
          src={videoSrc}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Caption layer — BUG-002: guard against null when captionAnimation === 'none' */}
      {CaptionComponent != null && captions.length > 0 && (
        <AbsoluteFill>
          <CaptionComponent words={captions} style={captionStyle} />
        </AbsoluteFill>
      )}

      {/* Progress bar */}
      {showProgressBar && <ProgressBar />}

      {/* CTA end screen */}
      {cta && (
        <Sequence
          from={durationInFrames - secondsToFrames(cta.duration, fps)}
          durationInFrames={secondsToFrames(cta.duration, fps)}
        >
          <CallToAction config={cta} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
