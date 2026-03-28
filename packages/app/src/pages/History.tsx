import { Clock } from 'lucide-react';

export function History() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">History</h2>
        <p className="mt-1 text-muted-foreground">Past renders and exports</p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No exports yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your rendered videos will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
