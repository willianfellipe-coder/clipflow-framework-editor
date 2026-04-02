import { Film, Clock, Monitor, Zap, Mic } from 'lucide-react';
import type { VideoMeta } from '@clip/shared';

interface VideoMetadataCardProps {
  name: string;
  meta: VideoMeta;
  thumbnailUrl?: string;
  onTranscribe: () => void;
  isTranscribing: boolean;
  transcriptionProgress?: { percent: number; currentSegment: string };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatResolution(w: number, h: number): string {
  if (h >= 2160) return '4K';
  if (h >= 1080) return '1080p';
  if (h >= 720) return '720p';
  return `${w}x${h}`;
}

export function VideoMetadataCard({
  name,
  meta,
  thumbnailUrl,
  onTranscribe,
  isTranscribing,
  transcriptionProgress,
}: VideoMetadataCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex gap-5">
        {/* Thumbnail */}
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded bg-secondary relative">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={name} 
              className="h-full w-full object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
            <Film className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{name}</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(meta.duration)}
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              {formatResolution(meta.width, meta.height)}
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {meta.fps}fps &middot; {meta.codec}
            </div>
            <div className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              {meta.audioCodec !== 'none' ? meta.audioCodec : 'No audio'}
            </div>
          </div>

          {/* Transcription progress */}
          {isTranscribing && transcriptionProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{transcriptionProgress.currentSegment}</span>
                <span className="font-medium text-primary">{transcriptionProgress.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${transcriptionProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Transcribe button */}
          {!isTranscribing && (
            <button
              onClick={onTranscribe}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Mic className="h-4 w-4" />
              Transcribe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
