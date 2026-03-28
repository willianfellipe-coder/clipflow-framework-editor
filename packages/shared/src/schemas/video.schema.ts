import { z } from 'zod';

export const videoMetaSchema = z.object({
  duration: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  codec: z.string(),
  bitrate: z.number().nonnegative(),
  audioCodec: z.string(),
  audioRate: z.number().positive(),
});
