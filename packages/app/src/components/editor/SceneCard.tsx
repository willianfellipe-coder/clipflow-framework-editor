import { cn } from '@/lib/utils';
import {
  Zap,
  MessageSquare,
  ArrowRightLeft,
  Film,
  Megaphone,
  LogOut,
} from 'lucide-react';

const typeConfig: Record<string, { color: string; bg: string; icon: typeof Zap }> = {
  hook: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: Zap },
  content: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: MessageSquare },
  transition: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: ArrowRightLeft },
  broll: { color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', icon: Film },
  cta: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: Megaphone },
  outro: { color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/30', icon: LogOut },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 10);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}.${ms}` : `${s}.${ms}s`;
}

interface SceneCardProps {
  type: string;
  order: number;
  startTime: number;
  endTime: number;
  description: string | null;
  isSelected: boolean;
  onClick: () => void;
}

export function SceneCard({ type, order, startTime, endTime, description, isSelected, onClick }: SceneCardProps) {
  const cfg = typeConfig[type] || typeConfig.content;
  const Icon = cfg.icon;

  return (
    <button
      onClick={onClick}
      aria-label={`${type} scene ${formatTime(startTime)} - ${formatTime(endTime)}`}
      className={cn(
        'w-full cursor-pointer rounded-md border p-2.5 text-left transition-all',
        cfg.bg,
        isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', cfg.color)} />
        <span className={cn('text-xs font-semibold uppercase', cfg.color)}>{type}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {formatTime(startTime)} - {formatTime(endTime)}
        </span>
      </div>
      {description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      )}
    </button>
  );
}
