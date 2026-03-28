import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  niche: z.string().min(1),
  composition: z.string().min(1),
  defaultCaptionStyleId: z.string().optional(),
  defaultEffects: z.string().optional(),
  defaultTransitions: z.string().optional(),
  colorPalette: z.string().optional(),
  musicConfig: z.string().optional(),
  hookConfig: z.string().optional(),
  ctaConfig: z.string().optional(),
  layoutConfig: z.string().optional(),
});
