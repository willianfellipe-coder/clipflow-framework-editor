import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Film, CheckCheck, ArrowLeft } from 'lucide-react';
import { useClipGenStore } from '@/stores/clipgenStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ClipGenConfig } from '@/components/clipgen/ClipGenConfig';
import { ClipCard } from '@/components/clipgen/ClipCard';
import { api } from '@/lib/api';
import type { Project, VideoMeta, ClipAnalysisRequest } from '@clip/shared';

export function ClipGen() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { subscribe } = useWebSocket();
  const {
    clips, fetchClips, analyzing, startAnalysis,
    updateClipStatus, rejectClip, selectedClipId, setSelectedClipId,
    selectAllClips,
  } = useClipGenStore();

  const [project, setProject] = useState<Project | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [hasTranscription, setHasTranscription] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    api.get<Project>(`/projects/${projectId}`).then((p) => {
      setProject(p);
      if (p.sourceVideoMeta) setMeta(JSON.parse(p.sourceVideoMeta as string));
    }).catch(() => {});

    api.get(`/projects/${projectId}/transcription`).then(() => setHasTranscription(true)).catch(() => {});
    fetchClips(projectId);
  }, [projectId, fetchClips]);

  // WebSocket events
  useEffect(() => {
    const unsub1 = subscribe('clipgen:progress', (data: unknown) => {
      const { stage } = data as { stage: string };
      setAnalyzeStage(stage);
      setIsAnalyzing(true);
    });
    const unsub2 = subscribe('clipgen:complete', (data: unknown) => {
      const { projectId: pid } = data as { projectId: string };
      if (pid === projectId) {
        setIsAnalyzing(false);
        fetchClips(projectId!);
      }
    });
    const unsub3 = subscribe('clipgen:error', (data: unknown) => {
      const { error } = data as { error: string };
      setIsAnalyzing(false);
      alert(`ClipGen error: ${error}`);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [projectId, subscribe, fetchClips]);

  const handleStartAnalysis = useCallback(async (config: ClipAnalysisRequest) => {
    if (!projectId) return;
    setIsAnalyzing(true);
    setAnalyzeStage('Starting analysis...');
    try {
      await startAnalysis(projectId, config);
    } catch (err) {
      setIsAnalyzing(false);
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }, [projectId, startAnalysis]);

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Select a project for ClipGen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Go to Dashboard and select a project</p>
        </div>
      </div>
    );
  }

  const suggestedClips = clips.filter((c) => c.status !== 'rejected');
  const selectedClips = clips.filter((c) => c.status === 'selected');
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            ClipGen
          </h2>
          <p className="text-sm text-muted-foreground">
            {project?.name} &middot; {meta ? `${Math.floor(meta.duration / 60)}:${String(Math.floor(meta.duration % 60)).padStart(2, '0')}` : ''}
          </p>
        </div>
        {selectedClips.length > 0 && (
          <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            {selectedClips.length} clips selected
          </span>
        )}
      </div>

      {/* Analysis config or progress */}
      {!hasTranscription ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Film className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Transcription Required</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and transcribe the video first, then come back to generate clips.
          </p>
          <button
            onClick={() => navigate(`/editor/${projectId}`)}
            className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to Editor
          </button>
        </div>
      ) : isAnalyzing ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 animate-pulse text-primary" />
          <h3 className="mt-4 font-semibold text-primary">Analyzing Video for Viral Moments...</h3>
          <p className="mt-1 text-sm text-muted-foreground">{analyzeStage}</p>
        </div>
      ) : suggestedClips.length === 0 ? (
        <ClipGenConfig onStart={handleStartAnalysis} />
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{suggestedClips.length} clips found</p>
          <div className="flex gap-2">
            <button
              onClick={() => selectAllClips(projectId)}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Select All
            </button>
            <button
              onClick={() => { setIsAnalyzing(false); }}
              className="rounded bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              Re-analyze
            </button>
          </div>
        </div>
      )}

      {/* Clips grid */}
      {suggestedClips.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestedClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isSelected={selectedClipId === clip.id}
              onSelect={() => setSelectedClipId(clip.id)}
              onAccept={() => updateClipStatus(clip.id, 'selected')}
              onReject={() => rejectClip(clip.id)}
            />
          ))}
        </div>
      )}

      {/* Selected clip detail */}
      {selectedClip && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold">{selectedClip.title}</h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Time Range</span>
              <p>{selectedClip.startTime.toFixed(1)}s - {selectedClip.endTime.toFixed(1)}s ({(selectedClip.endTime - selectedClip.startTime).toFixed(1)}s)</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Hook Score</span>
              <p className="text-lg font-bold text-primary">{selectedClip.hookScore}/100</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tone</span>
              <p className="capitalize">{selectedClip.emotionalTone}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Platform</span>
              <p className="capitalize">{selectedClip.targetPlatform.replace('_', ' ')}</p>
            </div>
          </div>
          {selectedClip.aiReason && (
            <div className="mt-3">
              <span className="text-xs text-muted-foreground">AI Reasoning</span>
              <p className="mt-1 text-sm">{selectedClip.aiReason}</p>
            </div>
          )}
          {Array.isArray(selectedClip.suggestedHashtags) && selectedClip.suggestedHashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {selectedClip.suggestedHashtags.map((tag) => (
                <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-xs">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
