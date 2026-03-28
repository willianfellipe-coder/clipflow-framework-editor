export type BatchStatus = 'pending' | 'processing' | 'paused' | 'done' | 'error';

export type BatchItemStatus =
  | 'pending'
  | 'transcribing'
  | 'analyzing'
  | 'rendering'
  | 'done'
  | 'error';

export interface BatchJob {
  id: string;
  name: string;
  status: BatchStatus;
  templateId: string | null;
  captionStyleId: string | null;
  formats: string;
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  settings: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface BatchItem {
  id: string;
  batchJobId: string;
  projectId: string | null;
  sourceVideoPath: string;
  status: BatchItemStatus;
  errorMessage: string | null;
  order: number;
  createdAt: Date;
}
