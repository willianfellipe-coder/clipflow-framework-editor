import { cn } from '@/lib/utils';

const typeColors: Record<string, string> = {
  hook: 'bg-red-500/30 border-red-500/50 text-red-300',
  content: 'bg-blue-500/30 border-blue-500/50 text-blue-300',
  transition: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300',
  broll: 'bg-teal-500/30 border-teal-500/50 text-teal-300',
  cta: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300',
  outro: 'bg-zinc-500/30 border-zinc-500/50 text-zinc-300',
};

interface SceneClipProps {
  type: string;
  startTime: number;
  endTime: number;
  pixelsPerSecond: number;
  isSelected: boolean;
  onClick: () => void;
}

export function SceneClip({ type, startTime, endTime, pixelsPerSecond, isSelected, onClick }: SceneClipProps) {
  const left = startTime * pixelsPerSecond;
  const width = Math.max(8, (endTime - startTime) * pixelsPerSecond);

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute top-1 bottom-1 rounded border text-[10px] font-medium capitalize overflow-hidden px-1 transition-all',
        typeColors[type] || typeColors.content,
        isSelected && 'ring-1 ring-white/50',
      )}
      style={{ left, width }}
      title={`${type}: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`}
    >
      {width > 30 && type}
    </button>
  );
}
