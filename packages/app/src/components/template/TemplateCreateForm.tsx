import { useState } from 'react';
import { X } from 'lucide-react';
import { NICHES } from '@clip/shared';

interface TemplateCreateFormProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    niche: string;
    defaultEffects: string[];
    defaultTransitions: string[];
    colorPalette: string[];
  }) => void;
}

const EFFECTS = ['zoom_punch', 'flash_on_beat', 'slow_zoom', 'screen_zoom', 'cursor_highlight', 'warm_grade', 'text_callout', 'product_spotlight', 'speaker_zoom', 'waveform_bg'];
const TRANSITIONS = ['cut', 'fade', 'slide', 'whip_pan', 'dissolve', 'zoom', 'morph'];

export function TemplateCreateForm({ onClose, onCreate }: TemplateCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('tech');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedTransitions, setSelectedTransitions] = useState<string[]>(['cut']);
  const [colors, setColors] = useState(['#6366F1', '#0F172A', '#F8FAFC']);

  const toggleEffect = (e: string) => {
    setSelectedEffects((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  };

  const toggleTransition = (t: string) => {
    setSelectedTransitions((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      niche,
      defaultEffects: selectedEffects,
      defaultTransitions: selectedTransitions,
      colorPalette: colors,
    });
  };

  // Pre-fill from niche
  const applyNicheDefaults = (nicheId: string) => {
    setNiche(nicheId);
    const n = NICHES[nicheId as keyof typeof NICHES];
    if (n) {
      setSelectedEffects([...n.defaultEffects]);
      setSelectedTransitions([...n.defaultTransitions]);
      setColors([...n.colorPalette]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-lg font-semibold">Create Custom Template</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Template"
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Template for..."
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Niche (pre-fills defaults)</label>
            <select
              value={niche}
              onChange={(e) => applyNicheDefaults(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
            >
              {Object.entries(NICHES).map(([id, n]) => (
                <option key={id} value={id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Effects</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {EFFECTS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEffect(e)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    selectedEffects.includes(e)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Transitions</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {TRANSITIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTransition(t)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    selectedTransitions.includes(t)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Color Palette</label>
            <div className="mt-1 flex gap-2">
              {colors.map((c, i) => (
                <input
                  key={i}
                  type="color"
                  value={c}
                  onChange={(e) => {
                    const updated = [...colors];
                    updated[i] = e.target.value;
                    setColors(updated);
                  }}
                  className="h-8 w-8 cursor-pointer rounded border border-border"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="rounded bg-secondary px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
}
