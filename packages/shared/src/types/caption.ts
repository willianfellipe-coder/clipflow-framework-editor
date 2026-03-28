export type CaptionAnimation =
  | 'none'
  | 'word-highlight'
  | 'karaoke'
  | 'pop'
  | 'glow'
  | 'typewriter'
  | 'bounce';

export type CaptionPosition = 'top' | 'center' | 'bottom';

export interface CaptionStyle {
  id: string;
  projectId: string | null;
  name: string;
  isPreset: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string | null;
  backgroundPadding: number | null;
  backgroundRadius: number | null;
  position: CaptionPosition;
  animation: CaptionAnimation;
  maxWordsPerLine: number;
  shadowConfig: string | null;
  createdAt: Date;
}
