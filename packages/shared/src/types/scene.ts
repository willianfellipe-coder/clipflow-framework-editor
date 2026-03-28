export type SceneType = 'hook' | 'content' | 'transition' | 'broll' | 'cta' | 'outro';

export interface Scene {
  id: string;
  projectId: string;
  analysisId: string | null;
  order: number;
  startTime: number;
  endTime: number;
  type: SceneType;
  description: string | null;
  captionText: string | null;
  effects: string | null;
  zoomConfig: string | null;
  transitionIn: string | null;
  transitionOut: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ScenePlan {
  scenes: Scene[];
  suggestedCuts: { start: number; end: number; reason: string }[];
  suggestedEffects: { timestamp: number; effect: string; reason: string }[];
  hookAnalysis: {
    score: number;
    currentHook: string;
    suggestion: string;
  };
  ctaAnalysis: {
    score: number;
    hasCta: boolean;
    suggestion: string;
  };
  contentScore: number;
  summary: string;
}
