import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Film, Brain } from 'lucide-react';
import type { PlayerRef } from '@remotion/player';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTimelineStore } from '@/stores/timelineStore';
import { useCaptionStore } from '@/stores/captionStore';
import { ScenePanel } from '@/components/editor/ScenePanel';
import { VideoPreview } from '@/components/preview/VideoPreview';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Project, VideoMeta, WordTimestamp } from '@clip/shared';

interface SceneInspectorData {
  id: string;
  type: string;
  startTime: number;
  endTime: number;
  description: string | null;
  effects: string[];
  transitionIn: string | null;
  transitionOut: string | null;
}

export function Editor() {
  const { projectId } = useParams();
  const { subscribe } = useWebSocket();
  const { scenes, selectedSceneId, setSelectedScene, fetchScenes, setCurrentTime } = useTimelineStore();

  const playerRef = useRef<PlayerRef>(null);
  const { words } = useCaptionStore();

  const [project, setProject] = useState<Project | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [hasTranscription, setHasTranscription] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{ contentScore?: number; hookAnalysis?: { score: number }; ctaAnalysis?: { score: number }; summary?: string } | null>(null);
  const [previewFormat, setPreviewFormat] = useState('reel_9x16');
  const [captionWords, setCaptionWords] = useState<WordTimestamp[]>([]);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    api.get<Project>(`/projects/${projectId}`).then((p) => {
      setProject(p);
      if (p.sourceVideoMeta) setMeta(JSON.parse(p.sourceVideoMeta as string));
      if (p.status === 'analyzing') setIsAnalyzing(true);
    }).catch(() => {});

    // Check if transcription exists and load captions
    api.get<{ wordTimestamps: WordTimestamp[] }>(`/projects/${projectId}/transcription`).then((t) => {
      setHasTranscription(true);
      setCaptionWords(t.wordTimestamps || []);
    }).catch(() => {
      setHasTranscription(false);
    });

    // Load scenes
    fetchScenes(projectId);

    // Load analysis if exists
    api.get<Record<string, unknown>>(`/projects/${projectId}/analysis`).then((a) => {
      setAnalysisResult(a as typeof analysisResult);
    }).catch(() => {});
  }, [projectId, fetchScenes]);

  // Listen for analysis events
  useEffect(() => {
    if (!projectId) return;

    const unsub1 = subscribe('analysis:progress', (data: unknown) => {
      const { projectId: pid, stage } = data as { projectId: string; stage: string };
      if (pid === projectId) {
        setIsAnalyzing(true);
        setAnalysisStage(stage);
      }
    });

    const unsub2 = subscribe('analysis:complete', (data: unknown) => {
      const { projectId: pid } = data as { projectId: string; analysisId: string };
      if (pid === projectId) {
        setIsAnalyzing(false);
        fetchScenes(projectId);
        api.get<Record<string, unknown>>(`/projects/${projectId}/analysis`).then((a) => {
          setAnalysisResult(a as typeof analysisResult);
        }).catch(() => {});
        api.get<Project>(`/projects/${projectId}`).then(setProject).catch(() => {});
      }
    });

    const unsub3 = subscribe('analysis:error', (data: unknown) => {
      const { projectId: pid, error } = data as { projectId: string; error: string };
      if (pid === projectId) {
        setIsAnalyzing(false);
        alert(`Analysis failed: ${error}`);
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [projectId, subscribe, fetchScenes]);

  const handleAnalyze = useCallback(async () => {
    if (!projectId) return;
    setIsAnalyzing(true);
    setAnalysisStage('Starting analysis...');
    try {
      await api.post(`/projects/${projectId}/analyze`, {});
    } catch (err) {
      setIsAnalyzing(false);
      alert(err instanceof Error ? err.message : 'Failed to start analysis');
    }
  }, [projectId]);

  const handleSelectScene = useCallback((id: string) => {
    setSelectedScene(id);
    const scene = scenes.find((s) => s.id === id);
    if (scene) setCurrentTime(scene.startTime);
  }, [scenes, setSelectedScene, setCurrentTime]);

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

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) as SceneInspectorData | undefined;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Project header */}
      {project && (
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">{project.name}</h2>
          <StatusBadge status={project.status} />
          {meta && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(meta.duration / 60)}:{String(Math.floor(meta.duration % 60)).padStart(2, '0')} &middot; {meta.width}x{meta.height}
            </span>
          )}
          {analysisResult?.contentScore !== undefined && (
            <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Score: {analysisResult.contentScore}/100
            </span>
          )}
        </div>
      )}

      {/* Main editor area */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Scene Panel (left) */}
        <div className="w-52 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
          <ScenePanel
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            onSelectScene={handleSelectScene}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analysisStage={analysisStage}
            hasTranscription={hasTranscription}
          />
        </div>

        {/* Preview (center) */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-3">
          <VideoPreview
            videoSrc={project ? `/static/uploads/${project.id}/original.mp4` : ''}
            scenes={scenes.map((s) => ({
              id: s.id,
              startTime: s.startTime,
              endTime: s.endTime,
              type: s.type,
              transitionIn: s.transitionIn,
              transitionOut: s.transitionOut,
              zoomConfig: s.zoomConfig ? (typeof s.zoomConfig === 'string' ? JSON.parse(s.zoomConfig) : s.zoomConfig) : null,
            }))}
            captions={captionWords.map((w) => ({ word: w.word, start: w.start, end: w.end }))}
            captionStyle={{
              fontFamily: 'Inter',
              fontSize: 48,
              fontWeight: '800',
              color: '#FFFFFF',
              highlightColor: '#FFD700',
              strokeColor: '#000000',
              strokeWidth: 4,
              position: 'bottom',
              maxWordsPerLine: 4,
            }}
            durationInSeconds={meta?.duration || 30}
            format={previewFormat}
            onFormatChange={setPreviewFormat}
            playerRef={playerRef}
          />
          {analysisResult?.summary && (
            <p className="mt-2 text-xs text-muted-foreground">{analysisResult.summary}</p>
          )}
        </div>

        {/* Inspector (right) */}
        <div className="w-60 shrink-0 rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Properties</h3>
          {selectedScene ? (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <p className="font-medium capitalize">{selectedScene.type}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Time Range</label>
                <p className="font-medium">
                  {selectedScene.startTime.toFixed(1)}s - {selectedScene.endTime.toFixed(1)}s
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({(selectedScene.endTime - selectedScene.startTime).toFixed(1)}s)
                  </span>
                </p>
              </div>
              {selectedScene.description && (
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <p className="text-xs">{selectedScene.description}</p>
                </div>
              )}
              {selectedScene.effects && selectedScene.effects.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Effects</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedScene.effects.map((e: string) => (
                      <span key={e} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Transitions</label>
                <p className="text-xs">
                  In: {selectedScene.transitionIn || 'cut'} &middot; Out: {selectedScene.transitionOut || 'cut'}
                </p>
              </div>

              {/* Analysis scores */}
              {analysisResult?.hookAnalysis && selectedScene.type === 'hook' && (
                <div className="rounded border border-border p-2">
                  <label className="text-xs text-muted-foreground">Hook Score</label>
                  <p className="text-lg font-bold text-primary">{analysisResult.hookAnalysis.score}/100</p>
                </div>
              )}
              {analysisResult?.ctaAnalysis && selectedScene.type === 'cta' && (
                <div className="rounded border border-border p-2">
                  <label className="text-xs text-muted-foreground">CTA Score</label>
                  <p className="text-lg font-bold text-emerald-400">{analysisResult.ctaAnalysis.score}/100</p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">Select a scene to edit</p>
          )}
        </div>
      </div>

      {/* Timeline (bottom) */}
      <div className="h-40 rounded-lg border border-border bg-card p-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
        {scenes.length > 0 ? (
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {scenes.map((scene) => {
              const duration = scene.endTime - scene.startTime;
              const width = Math.max(40, duration * 20);
              return (
                <button
                  key={scene.id}
                  onClick={() => handleSelectScene(scene.id)}
                  className={`shrink-0 rounded px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                    selectedSceneId === scene.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                  style={{ width: `${width}px` }}
                >
                  {scene.type}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Timeline will appear after analysis
          </p>
        )}
      </div>
    </div>
  );
}
