import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  fileName: string;
  percent: number;
  stage: 'uploading' | 'processing';
}

export function UploadProgress({ fileName, percent, stage }: UploadProgressProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {stage === 'uploading' ? 'Uploading...' : 'Processing video...'}
          </p>
        </div>
        <span className="text-sm font-medium text-primary">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
