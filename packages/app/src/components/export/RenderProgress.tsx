import { Loader2, X, Download, CheckCircle } from 'lucide-react';
import { ProgressRing } from '@/components/common/ProgressRing';

interface RenderInfo {
  renderId: string;
  format: string;
  percent: number;
  status: 'queued' | 'rendering' | 'done' | 'error';
  errorMessage?: string;
}

interface RenderProgressProps {
  renders: RenderInfo[];
  onCancel: (renderId: string) => void;
  onDownload: (renderId: string) => void;
  onClose: () => void;
}

export function RenderProgress({ renders, onCancel, onDownload, onClose }: RenderProgressProps) {
  const allDone = renders.every((r) => r.status === 'done' || r.status === 'error');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {allDone ? 'Export Complete' : 'Exporting...'}
        </h3>
        {allDone && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {renders.map((r) => (
        <div key={r.renderId} className="flex items-center gap-3 rounded-md border border-border p-3">
          {r.status === 'rendering' && <ProgressRing percent={r.percent} size={36} strokeWidth={3} />}
          {r.status === 'queued' && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
          {r.status === 'done' && <CheckCircle className="h-8 w-8 text-emerald-400" />}
          {r.status === 'error' && <X className="h-8 w-8 text-destructive" />}

          <div className="flex-1">
            <p className="text-sm font-medium">{r.format.replace(/_/g, ' ')}</p>
            <p className="text-xs text-muted-foreground">
              {r.status === 'rendering' && `${r.percent}%`}
              {r.status === 'queued' && 'Waiting...'}
              {r.status === 'done' && 'Complete'}
              {r.status === 'error' && (r.errorMessage || 'Failed')}
            </p>
          </div>

          {r.status === 'rendering' && (
            <button
              onClick={() => onCancel(r.renderId)}
              className="text-xs text-destructive hover:underline"
            >
              Cancel
            </button>
          )}
          {r.status === 'done' && (
            <button
              onClick={() => onDownload(r.renderId)}
              className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
