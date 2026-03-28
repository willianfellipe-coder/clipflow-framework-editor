import { X } from 'lucide-react';
import { NICHES } from '@clip/shared';
import type { Template } from '@clip/shared';

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onApply?: () => void;
  onDelete?: () => void;
}

export function TemplatePreview({ template, onClose, onApply, onDelete }: TemplatePreviewProps) {
  const niche = NICHES[template.niche as keyof typeof NICHES];
  const effects = template.defaultEffects ? JSON.parse(template.defaultEffects) : [];
  const transitions = template.defaultTransitions ? JSON.parse(template.defaultTransitions) : [];
  const colors = template.colorPalette ? JSON.parse(template.colorPalette) : niche?.colorPalette || [];
  const hookConfig = template.hookConfig ? JSON.parse(template.hookConfig) : null;
  const ctaConfig = template.ctaConfig ? JSON.parse(template.ctaConfig) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-lg font-semibold">{template.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Niche</label>
              <p className="font-medium capitalize">{niche?.name || template.niche}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Pacing</label>
              <p className="font-medium capitalize">{niche?.pacing || 'medium'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hook Strategy</label>
              <p className="font-medium">{hookConfig?.strategy || niche?.hookStrategy || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">CTA Style</label>
              <p className="font-medium">{ctaConfig?.style || niche?.ctaStyle || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Caption Style</label>
              <p className="font-medium">{niche?.captionStyle || 'word-highlight'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Composition</label>
              <p className="font-medium">{template.composition}</p>
            </div>
          </div>

          {/* Effects */}
          {effects.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Effects</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {effects.map((e: string) => (
                  <span key={e} className="rounded bg-secondary px-2 py-1 text-xs">{e}</span>
                ))}
              </div>
            </div>
          )}

          {/* Transitions */}
          {transitions.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Transitions</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {transitions.map((t: string) => (
                  <span key={t} className="rounded bg-secondary px-2 py-1 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Color Palette */}
          {colors.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Color Palette</label>
              <div className="mt-1 flex gap-2">
                {colors.map((c: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded border border-border" style={{ backgroundColor: c }} />
                    <span className="text-xs text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Used {template.usageCount} times
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div>
            {onDelete && !template.isBuiltIn && (
              <button
                onClick={onDelete}
                className="text-xs text-destructive hover:underline"
              >
                Delete template
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded bg-secondary px-3 py-1.5 text-xs font-medium"
            >
              Close
            </button>
            {onApply && (
              <button
                onClick={onApply}
                className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Apply to Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
