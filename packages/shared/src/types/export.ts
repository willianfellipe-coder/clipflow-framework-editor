export type ExportFormat =
  | 'reel_9x16'
  | 'tiktok_9x16'
  | 'feed_1x1'
  | 'feed_4x5'
  | 'story_9x16';

export type RenderStatus = 'queued' | 'rendering' | 'encoding' | 'done' | 'error';

export type QualityPreset = 'draft' | 'standard' | 'high' | 'maximum';

export interface RenderResult {
  id: string;
  projectId: string;
  format: ExportFormat;
  status: RenderStatus;
  outputPath: string | null;
  width: number;
  height: number;
  fps: number;
  codec: string;
  quality: QualityPreset;
  fileSize: number | null;
  renderTime: number | null;
  progress: number;
  errorMessage: string | null;
  compositionProps: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface RenderProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  eta?: number;
}
