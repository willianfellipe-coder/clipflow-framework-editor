import { useCallback, useRef } from 'react';

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  pixelsPerSecond: number;
  onSeek: (time: number) => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function TimelineRuler({ duration, currentTime, pixelsPerSecond, onSeek }: TimelineRulerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(duration, time)));
  }, [duration, pixelsPerSecond, onSeek]);

  // Generate tick marks every 5 seconds
  const ticks: number[] = [];
  for (let t = 0; t <= duration; t += 5) ticks.push(t);

  const playheadX = currentTime * pixelsPerSecond;

  return (
    <div
      ref={ref}
      className="relative h-6 cursor-pointer border-b border-border bg-zinc-900"
      style={{ width: duration * pixelsPerSecond }}
      onClick={handleClick}
    >
      {/* Tick marks */}
      {ticks.map((t) => (
        <div
          key={t}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: t * pixelsPerSecond }}
        >
          <div className="h-2 w-px bg-zinc-600" />
          <span className="text-[9px] text-zinc-500">{formatTime(t)}</span>
        </div>
      ))}

      {/* Playhead */}
      <div
        className="absolute top-0 z-20 h-full w-0.5 bg-red-500"
        style={{ left: playheadX }}
      >
        <div className="absolute -left-1.5 -top-0.5 h-2.5 w-3.5 rounded-sm bg-red-500" />
      </div>
    </div>
  );
}
