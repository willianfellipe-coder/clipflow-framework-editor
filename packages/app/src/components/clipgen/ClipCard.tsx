import { CheckCircle, X, Zap, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clip } from '@clip/shared';

const toneColors: Record<string, string> = {
  humor: 'text-yellow-400',
  drama: 'text-red-400',
  surprise: 'text-orange-400',
  insight: 'text-blue-400',
  controversy: 'text-pink-400',
  inspiration: 'text-emerald-400',
  educational: 'text-indigo-400',
  neutral: 'text-zinc-400',
};

interface ClipCardProps {
  clip: Clip;
  isSelected: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export function ClipCard({ clip, isSelected, onSelect, onAccept, onReject }: ClipCardProps) {
  const duration = (clip.endTime - clip.startTime).toFixed(1);
  const hashtags = Array.isArray(clip.suggestedHashtags) ? clip.suggestedHashtags : [];

  return (
    <div
      onClick={onSelect}
      className={cn(
        'cursor-pointer card-hover rounded-lg border bg-card p-4 transition-all',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40',
        clip.status === 'rejected' && 'opacity-40',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold line-clamp-1">{clip.title}</h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{clip.startTime.toFixed(1)}s - {clip.endTime.toFixed(1)}s ({duration}s)</span>
          </div>
        </div>

        {/* Hook score */}
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
          clip.hookScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
          clip.hookScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-zinc-500/20 text-zinc-400',
        )}>
          <Zap className="h-3 w-3" />
          {clip.hookScore}
        </div>
      </div>

      {/* Hook sentence */}
      {clip.hookSentence && (
        <p className="mt-2 text-xs italic text-muted-foreground line-clamp-2">"{clip.hookSentence}"</p>
      )}

      {/* Emotional tone */}
      <div className="mt-2 flex items-center gap-2">
        <span className={cn('text-[10px] font-medium uppercase', toneColors[clip.emotionalTone] || toneColors.neutral)}>
          {clip.emotionalTone}
        </span>
        {hashtags.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Hash className="h-2.5 w-2.5" />
            {hashtags.slice(0, 3).join(' ')}
          </div>
        )}
      </div>

      {/* Actions */}
      {clip.status === 'suggested' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <CheckCircle className="h-3 w-3" />
            Select
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReject(); }}
            className="inline-flex items-center justify-center rounded bg-secondary px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {clip.status === 'selected' && (
        <div className="mt-2 text-[10px] font-medium text-emerald-400">Selected for export</div>
      )}
    </div>
  );
}
