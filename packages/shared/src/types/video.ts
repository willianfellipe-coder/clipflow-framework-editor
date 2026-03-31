export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audioCodec: string;
  audioRate: number;
  profile?: string;
}
