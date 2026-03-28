import { Layers } from 'lucide-react';

export function BatchJobs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Batch Processing</h2>
        <p className="mt-1 text-muted-foreground">
          Process multiple videos with the same template and settings
        </p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No batch jobs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop multiple videos to start batch processing
          </p>
        </div>
      </div>
    </div>
  );
}
