export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface Segment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface TranscriptionResult {
  id: string;
  projectId: string;
  model: string;
  language: string | null;
  fullText: string;
  wordTimestamps: WordTimestamp[];
  segments: Segment[];
  speakers: string | null;
  duration: number;
  processingTime: number | null;
  createdAt: Date;
}
