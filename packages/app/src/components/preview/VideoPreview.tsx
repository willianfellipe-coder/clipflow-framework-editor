import { useMemo, useCallback } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { ReelComposition, type ReelProps } from '@clip/remotion';
import { FeedComposition, type FeedProps } from '@clip/remotion';
import type { CaptionWord, CaptionStyleConfig, SceneData } from '@clip/remotion';
import type { ExportFormat } from '@clip/shared';

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number; compositionId: string }> = {
  reel_9x16: { width: 1080, height: 1920, compositionId: 'ReelComposition' },
  tiktok_9x16: { width: 1080, height: 1920, compositionId: 'ReelComposition' },
  feed_1x1: { width: 1080, height: 1080, compositionId: 'FeedComposition' },
  feed_4x5: { width: 1080, height: 1350, compositionId: 'FeedComposition' },
  story_9x16: { width: 1080, height: 1920, compositionId: 'StoryComposition' },
};

interface VideoPreviewProps {
  videoSrc: string;
  scenes: SceneData[];
  captions: CaptionWord[];
  captionStyle: CaptionStyleConfig;
  captionAnimation?: 'word-highlight' | 'karaoke' | 'pop' | 'glow' | 'none';
  durationInSeconds: number;
  fps?: number;
  format: string;
  onFormatChange: (format: string) => void;
  playerRef?: React.RefObject<PlayerRef | null>;
}

const formats = [
  { id: 'reel_9x16', label: 'Reel 9:16' },
  { id: 'tiktok_9x16', label: 'TikTok 9:16' },
  { id: 'feed_1x1', label: 'Feed 1:1' },
  { id: 'feed_4x5', label: 'Feed 4:5' },
  { id: 'story_9x16', label: 'Story 9:16' },
];

export function VideoPreview({
  videoSrc,
  scenes,
  captions,
  captionStyle,
  captionAnimation = 'word-highlight',
  durationInSeconds,
  fps = 30,
  format,
  onFormatChange,
  playerRef,
}: VideoPreviewProps) {
  const dim = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.reel_9x16;
  const durationInFrames = Math.max(1, Math.round(durationInSeconds * fps));

  const inputProps: ReelProps = useMemo(() => ({
    videoSrc,
    scenes,
    captions,
    captionStyle,
    captionAnimation,
    showProgressBar: format !== 'tiktok_9x16',
  }), [videoSrc, scenes, captions, captionStyle, captionAnimation, format]);

  return (
    <div className="flex h-full flex-col">
      {/* Format selector */}
      <div className="mb-2 flex gap-1">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => onFormatChange(f.id)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              format === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Player */}
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded bg-black">
        {videoSrc ? (
          <Player
            ref={playerRef}
            component={ReelComposition as React.ComponentType<any>}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            compositionWidth={dim.width}
            compositionHeight={dim.height}
            fps={fps}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            controls
            autoPlay={false}
            loop
          />
        ) : (
          <p className="text-sm text-zinc-500">No video source</p>
        )}
      </div>
    </div>
  );
}
