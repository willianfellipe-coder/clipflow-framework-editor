import { Play, Pause, Trash2, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import type { BatchJob } from '@clip/shared';

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-zinc-400', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-400', label: 'Processing' },
  paused: { icon: Pause, color: 'text-yellow-400', label: 'Paused' },
  done: { icon: CheckCircle, color: 'text-emerald-400', label: 'Complete' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error' },
};

interface BatchJobCardProps {
  job: BatchJob;
  onStart: () => void;
  onPause: () => void;
  onDelete: () => void;
}

export function BatchJobCard({ job, onStart, onPause, onDelete }: BatchJobCardProps) {
  const cfg = statusConfig[job.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const formats = job.formats ? JSON.parse(job.formats) : [];
  const progressPercent = job.totalVideos > 0
    ? Math.round(((job.completedVideos + job.failedVideos) / job.totalVideos) * 100)
    : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${cfg.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <h3 className="font-medium">{job.name}</h3>
          <p className="text-xs text-muted-foreground">
            {job.completedVideos}/{job.totalVideos} complete
            {job.failedVideos > 0 && ` · ${job.failedVideos} failed`}
          </p>
        </div>
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Info row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{job.totalVideos} videos</span>
        {formats.length > 0 && (
          <span>{formats.join(', ').replace(/_/g, ' ')}</span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {(job.status === 'pending' || job.status === 'paused') && (
          <button
            onClick={onStart}
            className="cursor-pointer inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Play className="h-3 w-3" />
            {job.status === 'paused' ? 'Resume' : 'Start'}
          </button>
        )}
        {job.status === 'processing' && (
          <button
            onClick={onPause}
            className="cursor-pointer inline-flex items-center gap-1 rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
          >
            <Pause className="h-3 w-3" />
            Pause
          </button>
        )}
        <button
          onClick={onDelete}
          className="cursor-pointer inline-flex items-center gap-1 rounded bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
