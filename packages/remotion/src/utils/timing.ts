export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

export function getSceneFrameRange(
  startTime: number,
  endTime: number,
  fps: number,
): { from: number; durationInFrames: number } {
  const from = secondsToFrames(startTime, fps);
  const durationInFrames = secondsToFrames(endTime, fps) - from;
  return { from, durationInFrames: Math.max(1, durationInFrames) };
}
