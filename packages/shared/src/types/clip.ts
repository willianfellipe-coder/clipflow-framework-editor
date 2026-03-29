import type { CaptionAnimation } from './caption.js';

export type ClipStatus =
  | 'suggested'
  | 'selected'
  | 'editing'
  | 'queued'
  | 'rendering'
  | 'done'
  | 'error'
  | 'rejected';

export type EmotionalTone =
  | 'humor'
  | 'drama'
  | 'surprise'
  | 'insight'
  | 'controversy'
  | 'inspiration'
  | 'educational'
  | 'neutral';

export type TargetPlatform = 'tiktok' | 'youtube_shorts' | 'instagram_reels';

export type ClipQuality = 'draft' | 'standard' | 'high';

export interface Clip {
  id: string;
  projectId: string;
  analysisId: string | null;
  startTime: number;
  endTime: number;
  title: string;
  hookSentence: string | null;
  hookScore: number;
  emotionalTone: EmotionalTone;
  suggestedHashtags: string[];
  aiReason: string | null;
  captionStyleId: string | null;
  captionAnimation: CaptionAnimation;
  aspectRatio: string;
  zoomConfig: ClipZoomConfig | null;
  ctaConfig: ClipCtaConfig | null;
  showProgressBar: boolean;
  status: ClipStatus;
  orderIndex: number;
  quality: ClipQuality;
  outputFormat: string;
  targetPlatform: TargetPlatform;
  renderId: string | null;
  outputPath: string | null;
  thumbnailPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClipZoomConfig {
  enabled: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  scale: number;
}

export interface ClipCtaConfig {
  enabled: boolean;
  text: string;
  subtext?: string;
  animation: 'slide-up' | 'fade-in' | 'bounce';
  durationSeconds: number;
}

export interface ClipAnalysis {
  id: string;
  projectId: string;
  transcriptionId: string | null;
  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche: string | null;
  tone: string;
  customInstructions: string | null;
  rawResponse: string | null;
  clipsGenerated: number;
  modelUsed: string | null;
  tokensUsed: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ClipAnalysisRequest {
  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche?: string;
  tone?: string;
  customInstructions?: string;
}

export interface SuggestedClip {
  startTime: number;
  endTime: number;
  title: string;
  hookSentence: string;
  hookScore: number;
  emotionalTone: EmotionalTone;
  suggestedHashtags: string[];
  reason: string;
}

export interface ClipAnalysisResult {
  clips: SuggestedClip[];
  summary: string;
  totalMomentsFound: number;
}

export interface ClipPreset {
  id: string;
  name: string;
  description: string | null;
  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche: string | null;
  tone: string;
  customInstructions: string | null;
  captionStyleId: string | null;
  captionAnimation: CaptionAnimation;
  zoomConfig: ClipZoomConfig | null;
  ctaConfig: ClipCtaConfig | null;
  isBuiltIn: boolean;
}
