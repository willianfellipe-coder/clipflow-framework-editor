import { cn } from '@/lib/utils';
import { QUALITY_PRESETS } from '@clip/shared';
import type { QualityPreset } from '@clip/shared';

interface QualitySettingsProps {
  selected: QualityPreset;
  onChange: (quality: QualityPreset) => void;
}

const presets = Object.entries(QUALITY_PRESETS) as [QualityPreset, typeof QUALITY_PRESETS[keyof typeof QUALITY_PRESETS]][];

export function QualitySettings({ selected, onChange }: QualitySettingsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Quality</label>
      <div className="grid grid-cols-2 gap-2">
        {presets.map(([id, preset]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'cursor-pointer rounded-md border p-2.5 text-left transition-colors',
              selected === id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30',
            )}
          >
            <p className="text-sm font-medium">{preset.label}</p>
            <p className="text-[11px] text-muted-foreground">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
