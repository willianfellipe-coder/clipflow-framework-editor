export type WSEvent =
  | { event: 'connected'; data: { version: string } }
  | { event: 'transcription:progress'; data: { projectId: string; percent: number; currentSegment: string } }
  | { event: 'transcription:complete'; data: { projectId: string; transcriptionId: string } }
  | { event: 'analysis:progress'; data: { projectId: string; stage: string } }
  | { event: 'analysis:complete'; data: { projectId: string; analysisId: string } }
  | { event: 'render:progress'; data: { renderId: string; percent: number; currentFrame: number; totalFrames: number; eta: number } }
  | { event: 'render:complete'; data: { renderId: string; outputPath: string; fileSize: number } }
  | { event: 'render:error'; data: { renderId: string; error: string } }
  | { event: 'batch:item:progress'; data: { batchId: string; itemId: string; stage: string; percent: number } }
  | { event: 'batch:item:complete'; data: { batchId: string; itemId: string } }
  | { event: 'batch:complete'; data: { batchId: string; stats: { total: number; completed: number; failed: number } } };

export type WSEventName = WSEvent['event'];

export type WSEventData<E extends WSEventName> = Extract<WSEvent, { event: E }>['data'];
