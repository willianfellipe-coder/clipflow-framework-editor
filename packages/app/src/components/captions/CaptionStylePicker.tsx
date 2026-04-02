import { cn } from '@/lib/utils';
import type { CaptionAnimation } from '@clip/shared';

const styles: { id: CaptionAnimation; label: string; preview: string; color: string }[] = [
  { id: 'word-highlight', label: 'Highlight', preview: 'The active word glows', color: 'text-yellow-400' },
  { id: 'karaoke', label: 'Karaoke', preview: 'Fill reveals left to right', color: 'text-red-400' },
  { id: 'pop', label: 'Pop', preview: 'Words bounce in', color: 'text-green-400' },
  { id: 'glow', label: 'Glow', preview: 'Neon glow effect', color: 'text-emerald-400' },
  { id: 'none', label: 'None', preview: 'Static text', color: 'text-zinc-400' },
];

interface CaptionStylePickerProps {
  selected: CaptionAnimation;
  onChange: (style: CaptionAnimation) => void;
}

export function CaptionStylePicker({ selected, onChange }: CaptionStylePickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Caption Animation</label>
      <div className="grid grid-cols-2 gap-1.5">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              'cursor-pointer rounded border p-2 text-left text-xs transition-colors',
              selected === style.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/30',
            )}
          >
            <span className={cn('font-semibold', style.color)}>{style.label}</span>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{style.preview}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
