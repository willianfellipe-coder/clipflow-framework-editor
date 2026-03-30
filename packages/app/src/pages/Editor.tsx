import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Film, Download } from 'lucide-react';
import type { PlayerRef } from '@remotion/player';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTimelineStore } from '@/stores/timelineStore';
import { useCaptionStore } from '@/stores/captionStore';
import { ScenePanel } from '@/components/editor/ScenePanel';
import { VideoPreview } from '@/components/preview/VideoPreview';
import { TimelineEditor } from '@/components/timeline/TimelineEditor';
import { CaptionEditor } from '@/components/captions/CaptionEditor';
import { ExportDialog } from '@/components/export/ExportDialog';
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
  const playerRef = useRef<PlayerRef>(null);

  const { scenes, selectedSceneId, setSelectedScene, fetchScenes, currentTime, setCurrentTime, isPlaying, setPlaying } = useTimelineStore();
  const { words, selectedWordIndex, setSelectedWordIndex, captionAnimation, setCaptionAnimation, updateWord, updateWordTiming, fetchCaptions } = useCaptionStore();

  const [project, setProject] = useState<Project | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [hasTranscription, setHasTranscription] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMcpPending, setIsMcpPending] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ contentScore?: number; hookAnalysis?: { score: number }; ctaAnalysis?: { score: number }; summary?: string } | null>(null);
  const [previewFormat, setPreviewFormat] = useState('reel_9x16');
  const [inspectorTab, setInspectorTab] = useState<'scene' | 'caption'>('scene');
  const [showExport, setShowExport] = useState(false);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    api.get<Project>(`/projects/${projectId}`).then((p) => {
      setProject(p);
      if (p.sourceVideoMeta) setMeta(JSON.parse(p.sourceVideoMeta as string));
      if (p.status === 'analyzing') setIsAnalyzing(true);
      if (p.status === 'pending_mcp') setIsMcpPending(true);
    }).catch(() => {});

    api.get<{ wordTimestamps: WordTimestamp[] }>(`/projects/${projectId}/transcription`).then(() => {
      setHasTranscription(true);
      fetchCaptions(projectId);
    }).catch(() => setHasTranscription(false));

    fetchScenes(projectId);

    api.get<Record<string, unknown>>(`/projects/${projectId}/analysis`).then((a) => {
      setAnalysisResult(a as typeof analysisResult);
    }).catch(() => {});
  }, [projectId, fetchScenes, fetchCaptions]);

  // Analysis WebSocket events
  useEffect(() => {
    if (!projectId) return;

    const unsub1 = subscribe('analysis:progress', (data: unknown) => {
      const { projectId: pid, stage } = data as { projectId: string; stage: string };
      if (pid === projectId) { setIsAnalyzing(true); setAnalysisStage(stage); }
    });

    const unsub2 = subscribe('analysis:complete', (data: unknown) => {
      const { projectId: pid } = data as { projectId: string };
      if (pid === projectId) {
        setIsAnalyzing(false);
        setIsMcpPending(false);
        fetchScenes(projectId);
        api.get<Record<string, unknown>>(`/projects/${projectId}/analysis`).then((a) => setAnalysisResult(a as typeof analysisResult)).catch(() => {});
        api.get<Project>(`/projects/${projectId}`).then(setProject).catch(() => {});
      }
    });

    const unsub3 = subscribe('analysis:error', (data: unknown) => {
      const { projectId: pid, error } = data as { projectId: string; error: string };
      if (pid === projectId) { setIsAnalyzing(false); setIsMcpPending(false); setAnalysisError(error); }
    });

    const unsub4 = subscribe('analysis:mcp_pending', (data: unknown) => {
      const { projectId: pid } = data as { projectId: string };
      if (pid === projectId) {
        setIsAnalyzing(false);
        setIsMcpPending(true);
        setAnalysisError(null);
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [projectId, subscribe, fetchScenes]);

  const handleAnalyze = useCallback(async () => {
    if (!projectId) return;
    setIsAnalyzing(true);
    setIsMcpPending(false);
    setAnalysisStage('Starting analysis...');
    setAnalysisError(null);
    try { await api.post(`/projects/${projectId}/analyze`, {}); }
    catch (err) { setIsAnalyzing(false); setAnalysisError(err instanceof Error ? err.message : 'Analysis failed'); }
  }, [projectId]);

  const handleCancelAnalysis = useCallback(async () => {
    if (!projectId) return;
    try { await api.patch(`/projects/${projectId}`, { status: 'draft' }); } catch { /* ignore */ }
    setIsAnalyzing(false);
    setIsMcpPending(false);
    setAnalysisStage('');
  }, [projectId]);

  const handleSelectScene = useCallback((id: string) => {
    setSelectedScene(id);
    setInspectorTab('scene');
    const scene = scenes.find((s) => s.id === id);
    if (scene) setCurrentTime(scene.startTime);
  }, [scenes, setSelectedScene, setCurrentTime]);

  const handleSelectWord = useCallback((index: number) => {
    setSelectedWordIndex(index);
    setInspectorTab('caption');
    if (words[index]) setCurrentTime(words[index].start);
  }, [words, setSelectedWordIndex, setCurrentTime]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    playerRef.current?.seekTo(Math.round(time * 30));
  }, [setCurrentTime]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (isPlaying) { playerRef.current?.pause(); setPlaying(false); }
      else { playerRef.current?.play(); setPlaying(true); }
    },
    onSeekBack: () => handleSeek(Math.max(0, currentTime - 5)),
    onSeekForward: () => handleSeek(currentTime + 5),
  });

  const captionWords = useMemo(() =>
    words.map((w) => ({ word: w.word, start: w.start, end: w.end })),
  [words]);

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Film className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Select a project to start editing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a project from the Dashboard</p>
        </div>
      </div>
    );
  }

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) as SceneInspectorData | undefined;

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      {project && (
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="font-semibold">{project.name}</h2>
          <StatusBadge status={project.status} />
          {meta && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(meta.duration / 60)}:{String(Math.floor(meta.duration % 60)).padStart(2, '0')} &middot; {meta.width}x{meta.height}
            </span>
          )}
          {analysisResult?.contentScore !== undefined && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Score: {analysisResult.contentScore}/100
            </span>
          )}
          <button
            onClick={() => setShowExport(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      )}

      {/* Export dialog */}
      {showExport && projectId && (
        <ExportDialog projectId={projectId} onClose={() => setShowExport(false)} />
      )}

      {/* Main area */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        {/* Scene Panel */}
        <div className="w-48 shrink-0 flex flex-col gap-2">
          <div className="rounded-lg border border-border bg-card overflow-hidden flex-1">
            <ScenePanel
              scenes={scenes}
              selectedSceneId={selectedSceneId}
              onSelectScene={handleSelectScene}
              onAnalyze={handleAnalyze}
              onCancelAnalysis={handleCancelAnalysis}
              isAnalyzing={isAnalyzing}
              isMcpPending={isMcpPending}
              analysisStage={analysisStage}
              hasTranscription={hasTranscription}
              projectName={project?.name}
            />
          </div>
          {analysisError && (
            <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-2.5 text-xs text-red-300">
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-medium text-red-200">Análise falhou</span>
                <button onClick={() => setAnalysisError(null)} className="text-red-400 hover:text-red-200 leading-none shrink-0">×</button>
              </div>
              <p className="whitespace-pre-line leading-relaxed">{analysisError}</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-2 overflow-hidden">
          <VideoPreview
            videoSrc={project ? `/static/uploads/${project.id}/original.mp4` : ''}
            scenes={scenes.map((s) => ({
              id: s.id, startTime: s.startTime, endTime: s.endTime, type: s.type,
              transitionIn: s.transitionIn ?? undefined, transitionOut: s.transitionOut ?? undefined,
              zoomConfig: s.zoomConfig ? (typeof s.zoomConfig === 'string' ? JSON.parse(s.zoomConfig) : s.zoomConfig) : null,
            }))}
            captions={captionWords}
            captionStyle={{
              fontFamily: 'Inter', fontSize: 48, fontWeight: '800',
              color: '#FFFFFF', highlightColor: '#FFD700',
              strokeColor: '#000000', strokeWidth: 4,
              position: 'bottom', maxWordsPerLine: 4,
            }}
            captionAnimation={captionAnimation as any}
            durationInSeconds={meta?.duration || 30}
            format={previewFormat}
            onFormatChange={setPreviewFormat}
            playerRef={playerRef}
          />
        </div>

        {/* Inspector with tabs */}
        <div className="w-56 shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
          <div className="flex border-b border-border">
            <button
              onClick={() => setInspectorTab('scene')}
              className={`flex-1 py-1.5 text-xs font-medium ${inspectorTab === 'scene' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >Scene</button>
            <button
              onClick={() => setInspectorTab('caption')}
              className={`flex-1 py-1.5 text-xs font-medium ${inspectorTab === 'caption' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >Captions</button>
          </div>
          <div className="p-3">
            {inspectorTab === 'scene' ? (
              selectedScene ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <p className="font-medium capitalize">{selectedScene.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Time</label>
                    <p className="font-medium">
                      {selectedScene.startTime.toFixed(1)}s - {selectedScene.endTime.toFixed(1)}s
                      <span className="ml-1 text-xs text-muted-foreground">({(selectedScene.endTime - selectedScene.startTime).toFixed(1)}s)</span>
                    </p>
                  </div>
                  {selectedScene.description && (
                    <div>
                      <label className="text-xs text-muted-foreground">Description</label>
                      <p className="text-xs">{selectedScene.description}</p>
                    </div>
                  )}
                  {selectedScene.effects?.length > 0 && (
                    <div>
                      <label className="text-xs text-muted-foreground">Effects</label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedScene.effects.map((e: string) => (
                          <span key={e} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Select a scene</p>
              )
            ) : (
              <CaptionEditor
                words={words}
                selectedWordIndex={selectedWordIndex}
                captionAnimation={captionAnimation as any}
                onUpdateWord={updateWord}
                onUpdateTiming={updateWordTiming}
                onAnimationChange={setCaptionAnimation}
              />
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="h-28 shrink-0 rounded-lg border border-border bg-card overflow-hidden">
        {scenes.length > 0 || words.length > 0 ? (
          <TimelineEditor
            scenes={scenes}
            words={words}
            duration={meta?.duration || 30}
            currentTime={currentTime}
            selectedSceneId={selectedSceneId}
            selectedWordIndex={selectedWordIndex}
            onSeek={handleSeek}
            onSelectScene={handleSelectScene}
            onSelectWord={handleSelectWord}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">Timeline appears after transcription and analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
