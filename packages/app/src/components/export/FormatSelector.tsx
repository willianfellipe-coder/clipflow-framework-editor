import { cn } from '@/lib/utils';
import type { ExportFormat } from '@clip/shared';

const formats: { id: ExportFormat; label: string; specs: string; platform: string }[] = [
  { id: 'reel_9x16', label: 'Instagram Reel', specs: '1080x1920 · 30fps · max 90s', platform: 'Instagram' },
  { id: 'tiktok_9x16', label: 'TikTok', specs: '1080x1920 · 30fps · max 180s', platform: 'TikTok' },
  { id: 'feed_1x1', label: 'Feed Square', specs: '1080x1080 · 30fps · max 60s', platform: 'Instagram' },
  { id: 'feed_4x5', label: 'Feed Portrait', specs: '1080x1350 · 30fps · max 60s', platform: 'Instagram' },
  { id: 'story_9x16', label: 'Story', specs: '1080x1920 · 30fps · max 60s', platform: 'Instagram' },
];

interface FormatSelectorProps {
  selected: ExportFormat[];
  onChange: (formats: ExportFormat[]) => void;
}

export function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  const toggle = (id: ExportFormat) => {
    if (selected.includes(id)) {
      onChange(selected.filter((f) => f !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Export Formats</label>
      {formats.map((fmt) => (
        <button
          key={fmt.id}
          onClick={() => toggle(fmt.id)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
            selected.includes(fmt.id)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30',
          )}
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded border',
              selected.includes(fmt.id)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border',
            )}
          >
            {selected.includes(fmt.id) && <span className="text-xs">&#10003;</span>}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{fmt.label}</p>
            <p className="text-[11px] text-muted-foreground">{fmt.specs}</p>
          </div>
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {fmt.platform}
          </span>
        </button>
      ))}
    </div>
  );
}
