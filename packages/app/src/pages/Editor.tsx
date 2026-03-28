import { useParams } from 'react-router-dom';
import { Film } from 'lucide-react';

export function Editor() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Film className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Select a project to start editing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a project from the Dashboard or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top: Preview + Inspector */}
      <div className="flex flex-1 gap-4">
        {/* Scene Panel */}
        <div className="w-48 rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Scenes</h3>
          <p className="mt-4 text-xs text-muted-foreground">No scenes yet</p>
        </div>

        {/* Preview */}
        <div className="flex-1 rounded-lg border border-border bg-card p-4">
          <div className="flex aspect-[9/16] max-h-[60vh] items-center justify-center rounded bg-black mx-auto">
            <p className="text-sm text-zinc-500">Preview</p>
          </div>
        </div>

        {/* Inspector */}
        <div className="w-64 rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Properties</h3>
          <p className="mt-4 text-xs text-muted-foreground">Select a scene to edit</p>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-48 rounded-lg border border-border bg-card p-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Timeline will appear after transcription and analysis
        </p>
      </div>
    </div>
  );
}
