import { useRef, useState, useCallback } from 'react';
import { Film, MessageSquare, Sparkles } from 'lucide-react';
import { TimelineRuler } from './TimelineRuler';
import { SceneClip } from './SceneClip';
import { CaptionTrack } from './CaptionTrack';
import type { Scene, WordTimestamp } from '@clip/shared';

interface TimelineEditorProps {
  scenes: Scene[];
  words: WordTimestamp[];
  duration: number;
  currentTime: number;
  selectedSceneId: string | null;
  selectedWordIndex: number | null;
  onSeek: (time: number) => void;
  onSelectScene: (id: string) => void;
  onSelectWord: (index: number) => void;
}

const TRACK_HEIGHT = 32;
const MIN_PPS = 10;
const MAX_PPS = 100;

export function TimelineEditor({
  scenes,
  words,
  duration,
  currentTime,
  selectedSceneId,
  selectedWordIndex,
  onSeek,
  onSelectScene,
  onSelectWord,
}: TimelineEditorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(30);

  const handleZoom = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setPixelsPerSecond((prev) =>
        Math.max(MIN_PPS, Math.min(MAX_PPS, prev - e.deltaY * 0.1)),
      );
    }
  }, []);

  const timelineWidth = Math.max(600, duration * pixelsPerSecond);

  const tracks = [
    {
      label: 'Scenes',
      icon: Film,
      content: (
        <div className="relative h-full" style={{ width: timelineWidth }}>
          {scenes.map((scene) => (
            <SceneClip
              key={scene.id}
              type={scene.type}
              startTime={scene.startTime}
              endTime={scene.endTime}
              pixelsPerSecond={pixelsPerSecond}
              isSelected={selectedSceneId === scene.id}
              onClick={() => onSelectScene(scene.id)}
            />
          ))}
        </div>
      ),
    },
    {
      label: 'Captions',
      icon: MessageSquare,
      content: (
        <div className="relative h-full" style={{ width: timelineWidth }}>
          <CaptionTrack
            words={words}
            pixelsPerSecond={pixelsPerSecond}
            selectedWordIndex={selectedWordIndex}
            onSelectWord={onSelectWord}
          />
        </div>
      ),
    },
  ];

  // Playhead line across all tracks
  const playheadX = currentTime * pixelsPerSecond;

  return (
    <div className="flex h-full flex-col" onWheel={handleZoom}>
      {/* Zoom indicator */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1">
        <span className="text-[10px] text-muted-foreground">
          {scenes.length} scenes &middot; {words.length} words
        </span>
        <span className="text-[10px] text-muted-foreground">
          Zoom: {Math.round(pixelsPerSecond)}px/s (Ctrl+Scroll)
        </span>
      </div>

      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: timelineWidth, position: 'relative' }}>
          {/* Ruler */}
          <TimelineRuler
            duration={duration}
            currentTime={currentTime}
            pixelsPerSecond={pixelsPerSecond}
            onSeek={onSeek}
          />

          {/* Tracks */}
          {tracks.map((track) => (
            <div key={track.label} className="flex border-b border-border">
              <div className="flex w-20 shrink-0 items-center gap-1 border-r border-border px-2 bg-zinc-900/50">
                <track.icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{track.label}</span>
              </div>
              <div className="relative flex-1" style={{ height: TRACK_HEIGHT }}>
                {track.content}
              </div>
            </div>
          ))}

          {/* Playhead line spanning all tracks */}
          <div
            className="pointer-events-none absolute top-6 bottom-0 z-10 w-px bg-red-500/60"
            style={{ left: playheadX + 80 }}
          />
        </div>
      </div>
    </div>
  );
}
