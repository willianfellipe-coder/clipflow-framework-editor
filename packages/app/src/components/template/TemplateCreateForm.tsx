import { useState } from 'react';
import { X } from 'lucide-react';
import { NICHES } from '@clip/shared';

export interface TemplateFormData {
  name: string;
  description: string;
  niche: string;
  defaultEffects: string[];
  defaultTransitions: string[];
  colorPalette: string[];
  hookConfig: { strategy: string; durationSeconds: number };
  ctaConfig: { style: string; enabled: boolean; text: string; durationSeconds: number };
  pacing: string;
  captionAnimation: string;
}

interface TemplateCreateFormProps {
  onClose: () => void;
  onCreate: (data: TemplateFormData) => void;
}

const EFFECTS = ['zoom_punch', 'flash_on_beat', 'slow_zoom', 'screen_zoom', 'cursor_highlight', 'warm_grade', 'text_callout', 'product_spotlight', 'speaker_zoom', 'waveform_bg'];
const TRANSITIONS = ['cut', 'fade'];
const HOOK_STRATEGIES = ['before_after', 'problem_statement', 'end_result_first', 'curiosity_gap', 'urgency', 'controversial_quote'];
const CTA_STYLES = ['follow_for_more', 'link_in_bio', 'save_recipe', 'follow_for_tips', 'shop_now', 'full_episode_link'];
const CAPTION_ANIMATIONS = ['word-highlight', 'karaoke', 'pop', 'glow', 'none'];
const PACING_OPTIONS = ['fast', 'medium', 'slow', 'dynamic'];

export function TemplateCreateForm({ onClose, onCreate }: TemplateCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('tech');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedTransitions, setSelectedTransitions] = useState<string[]>(['cut']);
  const [colors, setColors] = useState(['#6366F1', '#0F172A', '#F8FAFC']);
  const [hookStrategy, setHookStrategy] = useState('problem_statement');
  const [hookDuration, setHookDuration] = useState(3);
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaStyle, setCtaStyle] = useState('follow_for_more');
  const [ctaText, setCtaText] = useState('Follow for more!');
  const [ctaDuration, setCtaDuration] = useState(3);
  const [pacing, setPacing] = useState('medium');
  const [captionAnimation, setCaptionAnimation] = useState('word-highlight');

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
      hookConfig: { strategy: hookStrategy, durationSeconds: hookDuration },
      ctaConfig: { style: ctaStyle, enabled: ctaEnabled, text: ctaText, durationSeconds: ctaDuration },
      pacing,
      captionAnimation,
    });
  };

  const applyNicheDefaults = (nicheId: string) => {
    setNiche(nicheId);
    const n = NICHES[nicheId as keyof typeof NICHES];
    if (n) {
      setSelectedEffects([...n.defaultEffects]);
      setSelectedTransitions([...n.defaultTransitions]);
      setColors([...n.colorPalette]);
      setHookStrategy(n.hookStrategy);
      setCtaStyle(n.ctaStyle);
      setPacing(n.pacing);
      const captionMap: Record<string, string> = { pop: 'pop', karaoke: 'karaoke', glow: 'glow', 'word-highlight': 'word-highlight' };
      setCaptionAnimation(captionMap[n.captionStyle] || 'word-highlight');
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
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Custom Template"
                className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Template for..."
                className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">Niche (pre-fills)</label>
              <select value={niche} onChange={(e) => applyNicheDefaults(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded border border-border bg-zinc-900 px-3 py-2 text-sm">
                {Object.entries(NICHES).map(([id, n]) => (
                  <option key={id} value={id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Pacing</label>
              <select value={pacing} onChange={(e) => setPacing(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded border border-border bg-zinc-900 px-3 py-2 text-sm">
                {PACING_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Caption animation */}
          <div>
            <label className="block text-sm font-medium">Caption Animation</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {CAPTION_ANIMATIONS.map((a) => (
                <button key={a} onClick={() => setCaptionAnimation(a)}
                  className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${captionAnimation === a ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Hook config */}
          <div className="rounded border border-border p-3">
            <label className="block text-sm font-semibold">Hook Strategy</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={hookStrategy} onChange={(e) => setHookStrategy(e.target.value)}
                className="cursor-pointer rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs">
                {HOOK_STRATEGIES.map((h) => (
                  <option key={h} value={h}>{h.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Duration:</label>
                <input type="number" min={1} max={10} value={hookDuration} onChange={(e) => setHookDuration(Number(e.target.value))}
                  className="w-16 rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs" />
                <span className="text-xs text-muted-foreground">s</span>
              </div>
            </div>
          </div>

          {/* CTA config */}
          <div className="rounded border border-border p-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold">Call to Action</label>
              <button onClick={() => setCtaEnabled(!ctaEnabled)}
                className={`cursor-pointer rounded px-2 py-0.5 text-xs ${ctaEnabled ? 'bg-emerald-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
                {ctaEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {ctaEnabled && (
              <div className="mt-2 space-y-2">
                <select value={ctaStyle} onChange={(e) => setCtaStyle(e.target.value)}
                  className="w-full cursor-pointer rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs">
                  {CTA_STYLES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Follow for more!"
                  className="w-full rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Duration:</label>
                  <input type="number" min={1} max={10} value={ctaDuration} onChange={(e) => setCtaDuration(Number(e.target.value))}
                    className="w-16 rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs" />
                  <span className="text-xs text-muted-foreground">s</span>
                </div>
              </div>
            )}
          </div>

          {/* Effects */}
          <div>
            <label className="block text-sm font-medium">Effects</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {EFFECTS.map((e) => (
                <button key={e} onClick={() => toggleEffect(e)}
                  className={`cursor-pointer rounded px-2 py-1 text-xs transition-colors ${selectedEffects.includes(e) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {e.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Transitions */}
          <div>
            <label className="block text-sm font-medium">Transitions</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {TRANSITIONS.map((t) => (
                <button key={t} onClick={() => toggleTransition(t)}
                  className={`cursor-pointer rounded px-2 py-1 text-xs transition-colors ${selectedTransitions.includes(t) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-sm font-medium">Color Palette</label>
            <div className="mt-1 flex gap-2">
              {colors.map((c, i) => (
                <input key={i} type="color" value={c}
                  onChange={(e) => { const u = [...colors]; u[i] = e.target.value; setColors(u); }}
                  className="h-8 w-8 cursor-pointer rounded border border-border" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="cursor-pointer rounded bg-secondary px-4 py-2 text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim()}
            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
}
