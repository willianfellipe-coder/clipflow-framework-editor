import { NICHES } from '@clip/shared';
import type { Template } from '@clip/shared';

interface TemplateCardProps {
  template: Template;
  onPreview: () => void;
  onApply?: () => void;
}

export function TemplateCard({ template, onPreview, onApply }: TemplateCardProps) {
  const niche = NICHES[template.niche as keyof typeof NICHES];
  const colors = niche?.colorPalette || ['#6366F1', '#0F172A', '#F8FAFC'];
  const effects = template.defaultEffects ? JSON.parse(template.defaultEffects) : [];
  const transitions = template.defaultTransitions ? JSON.parse(template.defaultTransitions) : [];

  return (
    <div role="button" tabIndex={0} className="group cursor-pointer card-hover rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
      {/* Colored header */}
      <div
        className="flex h-28 items-center justify-center rounded-t-lg"
        style={{ background: `linear-gradient(135deg, ${colors[0]}30, ${colors[1] || colors[0]}20)` }}
      >
        <span className="text-4xl font-black" style={{ color: colors[0] }}>
          {template.niche.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold">{template.name}</h3>
        {template.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        )}

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">{template.niche}</span>
          {template.isBuiltIn && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">built-in</span>
          )}
          {niche?.pacing && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{niche.pacing} pace</span>
          )}
        </div>

        {/* Effects preview */}
        {effects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {effects.slice(0, 3).map((e: string) => (
              <span key={e} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{e}</span>
            ))}
          </div>
        )}

        {/* Color palette */}
        <div className="mt-2 flex gap-1">
          {colors.map((c: string, i: number) => (
            <div key={i} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 rounded bg-secondary px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Preview
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="flex-1 rounded bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
