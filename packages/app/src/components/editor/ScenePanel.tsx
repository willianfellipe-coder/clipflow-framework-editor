import { Brain } from 'lucide-react';
import { SceneCard } from './SceneCard';
import { AnalysisProgress } from './AnalysisProgress';

interface SceneData {
  id: string;
  type: string;
  order: number;
  startTime: number;
  endTime: number;
  description: string | null;
}

interface ScenePanelProps {
  scenes: SceneData[];
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  onAnalyze: () => void;
  onCancelAnalysis?: () => void;
  isAnalyzing: boolean;
  isMcpPending?: boolean;
  analysisStage: string;
  hasTranscription: boolean;
  projectName?: string;
}

export function ScenePanel({
  scenes,
  selectedSceneId,
  onSelectScene,
  onAnalyze,
  onCancelAnalysis,
  isAnalyzing,
  isMcpPending,
  analysisStage,
  hasTranscription,
  projectName,
}: ScenePanelProps) {
  if (isAnalyzing || isMcpPending) {
    return (
      <div className="flex h-full flex-col p-3">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Scenes</h3>
        <AnalysisProgress
          stage={analysisStage}
          isMcpPending={isMcpPending}
          projectName={projectName}
          onCancel={isMcpPending ? onCancelAnalysis : undefined}
        />
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-3 text-center">
        <Brain className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {hasTranscription
            ? 'No scenes yet. Run AI analysis to generate a scene plan.'
            : 'Transcribe the video first, then analyze with AI.'}
        </p>
        {hasTranscription && (
          <button
            onClick={onAnalyze}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Brain className="h-3.5 w-3.5" />
            Analyze with AI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Scenes ({scenes.length})
        </h3>
        <button
          onClick={onAnalyze}
          className="text-xs text-primary hover:underline"
          title="Re-analyze"
        >
          Re-analyze
        </button>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            type={scene.type}
            order={scene.order}
            startTime={scene.startTime}
            endTime={scene.endTime}
            description={scene.description}
            isSelected={selectedSceneId === scene.id}
            onClick={() => onSelectScene(scene.id)}
          />
        ))}
      </div>
    </div>
  );
}
