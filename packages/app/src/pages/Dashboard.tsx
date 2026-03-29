import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DropZone } from '@/components/upload/DropZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { VideoMetadataCard } from '@/components/upload/VideoMetadataCard';
import { api } from '@/lib/api';
import type { Project, VideoMeta } from '@clip/shared';

export function Dashboard() {
  const { projects, fetchProjects, loading } = useProjectStore();
  const { subscribe } = useWebSocket();
  const navigate = useNavigate();

  // Upload state
  const [uploadState, setUploadState] = useState<
    | { stage: 'idle' }
    | { stage: 'uploading'; fileName: string; percent: number }
    | { stage: 'done'; project: Project; meta: VideoMeta }
    | { stage: 'transcribing'; project: Project; meta: VideoMeta; progress: { percent: number; currentSegment: string } }
    | { stage: 'transcribed'; project: Project; meta: VideoMeta }
  >({ stage: 'idle' });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Listen for transcription events
  useEffect(() => {
    const unsub1 = subscribe('transcription:progress', (data: unknown) => {
      const { projectId, percent, currentSegment } = data as { projectId: string; percent: number; currentSegment: string };
      setUploadState((prev) => {
        if ((prev.stage === 'transcribing' || prev.stage === 'done') && prev.project.id === projectId) {
          return { ...prev, stage: 'transcribing', progress: { percent, currentSegment } };
        }
        return prev;
      });
    });

    const unsub2 = subscribe('transcription:complete', (data: unknown) => {
      const { projectId } = data as { projectId: string };
      setUploadState((prev) => {
        if ((prev.stage === 'transcribing') && prev.project.id === projectId) {
          return { ...prev, stage: 'transcribed' };
        }
        return prev;
      });
      fetchProjects();
    });

    return () => { unsub1(); unsub2(); };
  }, [subscribe, fetchProjects]);

  const handleFileSelected = useCallback(async (file: File) => {
    setUploadState({ stage: 'uploading', fileName: file.name, percent: 0 });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use XMLHttpRequest for upload progress
      const project = await new Promise<Project>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadState({ stage: 'uploading', fileName: file.name, percent });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || `Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      const meta: VideoMeta = project.sourceVideoMeta
        ? JSON.parse(project.sourceVideoMeta as string)
        : { duration: 0, width: 0, height: 0, fps: 0, codec: 'unknown', bitrate: 0, audioCodec: 'none', audioRate: 0 };

      setUploadState({ stage: 'done', project, meta });
      fetchProjects();
    } catch (err) {
      setUploadState({ stage: 'idle' });
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [fetchProjects]);

  const handleTranscribe = useCallback(async () => {
    if (uploadState.stage !== 'done') return;
    const { project, meta } = uploadState;

    setUploadState({
      stage: 'transcribing',
      project,
      meta,
      progress: { percent: 0, currentSegment: 'Starting...' },
    });

    try {
      await api.post(`/projects/${project.id}/transcribe`, {});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Transcription failed to start');
      setUploadState({ stage: 'done', project, meta });
    }
  }, [uploadState]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Welcome to ClipFlow</h2>
        <p className="mt-1 text-muted-foreground">
          AI-powered video editing for Instagram Reels and TikTok
        </p>
      </div>

      {/* Upload / Processing Area */}
      {uploadState.stage === 'idle' && (
        <DropZone onFileSelected={handleFileSelected} />
      )}

      {uploadState.stage === 'uploading' && (
        <UploadProgress
          fileName={uploadState.fileName}
          percent={uploadState.percent}
          stage="uploading"
        />
      )}

      {(uploadState.stage === 'done' || uploadState.stage === 'transcribing') && (
        <VideoMetadataCard
          name={uploadState.project.name}
          meta={uploadState.meta}
          thumbnailUrl={`/static/uploads/${uploadState.project.id}/thumbnail.jpg`}
          onTranscribe={handleTranscribe}
          isTranscribing={uploadState.stage === 'transcribing'}
          transcriptionProgress={uploadState.stage === 'transcribing' ? uploadState.progress : undefined}
        />
      )}

      {uploadState.stage === 'transcribed' && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-5">
          <h3 className="font-semibold text-emerald-400">Transcription Complete!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready for AI analysis. Open the editor to continue.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => navigate(`/editor/${uploadState.project.id}`)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open in Editor
            </button>
            <button
              onClick={() => { setUploadState({ stage: 'idle' }); fetchProjects(); }}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <h3 className="text-lg font-semibold">Recent Projects</h3>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No projects yet. Upload a video to get started.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                aria-label={project.name}
                className="cursor-pointer rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
              >
                <div className="aspect-video overflow-hidden rounded bg-secondary">
                  <img
                    src={`/static/uploads/${project.id}/thumbnail.jpg`}
                    alt={project.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <h4 className="mt-3 font-medium">{project.name}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
