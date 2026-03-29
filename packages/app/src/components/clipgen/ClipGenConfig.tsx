import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { ClipAnalysisRequest, TargetPlatform } from '@clip/shared';

interface ClipGenConfigProps {
  onStart: (config: ClipAnalysisRequest) => void;
  disabled?: boolean;
}

export function ClipGenConfig({ onStart, disabled }: ClipGenConfigProps) {
  const [targetDuration, setTargetDuration] = useState(30);
  const [numberOfClips, setNumberOfClips] = useState(5);
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('tiktok');
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('energetic');
  const [customInstructions, setCustomInstructions] = useState('');

  const handleSubmit = () => {
    onStart({
      targetDuration,
      numberOfClips,
      targetPlatform,
      niche: niche || undefined,
      tone,
      customInstructions: customInstructions || undefined,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-primary" />
        Generate Clips
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Platform</label>
          <select
            value={targetPlatform}
            onChange={(e) => setTargetPlatform(e.target.value as TargetPlatform)}
            className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="tiktok">TikTok</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="instagram_reels">Instagram Reels</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Target Duration</label>
          <select
            value={targetDuration}
            onChange={(e) => setTargetDuration(Number(e.target.value))}
            className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Number of Clips</label>
          <input
            type="number"
            min={1}
            max={20}
            value={numberOfClips}
            onChange={(e) => setNumberOfClips(Number(e.target.value))}
            className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="energetic">Energetic</option>
            <option value="professional">Professional</option>
            <option value="informal">Informal</option>
            <option value="calm">Calm</option>
            <option value="humorous">Humorous</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Niche (optional)</label>
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g., education, comedy, business, tech"
          className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Custom Instructions (optional)</label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g., focus on humor moments, avoid technical jargon..."
          rows={2}
          className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Sparkles className="mr-2 inline h-4 w-4" />
        Analyze & Generate {numberOfClips} Clips
      </button>
    </div>
  );
}
