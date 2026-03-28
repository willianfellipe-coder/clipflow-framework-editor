import { useEffect, useState, useCallback } from 'react';
import { Layers, Plus } from 'lucide-react';
import { useBatchStore } from '@/stores/batchStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BatchJobCard } from '@/components/batch/BatchJobCard';

export function BatchJobs() {
  const { jobs, loading, fetchJobs, createBatch, startBatch, pauseBatch, deleteBatch } = useBatchStore();
  const { subscribe } = useWebSocket();
  const [showCreate, setShowCreate] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchPaths, setNewBatchPaths] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Listen for batch events to refresh
  useEffect(() => {
    const unsub1 = subscribe('batch:item:complete', () => fetchJobs());
    const unsub2 = subscribe('batch:complete', () => fetchJobs());
    return () => { unsub1(); unsub2(); };
  }, [subscribe, fetchJobs]);

  const handleCreate = useCallback(async () => {
    const paths = newBatchPaths.split('\n').map((p) => p.trim()).filter(Boolean);
    if (paths.length === 0) return;

    await createBatch({
      name: newBatchName || `Batch ${new Date().toLocaleDateString()}`,
      videoPaths: paths,
      formats: ['reel_9x16'],
    });
    setShowCreate(false);
    setNewBatchName('');
    setNewBatchPaths('');
  }, [newBatchName, newBatchPaths, createBatch]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this batch job?')) return;
    await deleteBatch(id);
  }, [deleteBatch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Processing</h2>
          <p className="mt-1 text-muted-foreground">
            Process multiple videos with the same template and settings
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Batch
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Create Batch Job</h3>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              placeholder="My batch job"
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Video file paths (one per line)</label>
            <textarea
              value={newBatchPaths}
              onChange={(e) => setNewBatchPaths(e.target.value)}
              placeholder="/path/to/video1.mp4&#10;/path/to/video2.mp4&#10;/path/to/video3.mp4"
              rows={5}
              className="mt-1 w-full rounded border border-border bg-zinc-900 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newBatchPaths.trim()}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded bg-secondary px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 && !showCreate ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No batch jobs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "New Batch" to start processing multiple videos
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <BatchJobCard
              key={job.id}
              job={job}
              onStart={() => startBatch(job.id)}
              onPause={() => pauseBatch(job.id)}
              onDelete={() => handleDelete(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
