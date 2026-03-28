import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  sourceVideoPath: z.string().min(1),
  templateId: z.string().optional(),
  nicheId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'transcribing', 'analyzing', 'editing', 'rendering', 'done', 'error']).optional(),
  templateId: z.string().nullable().optional(),
  nicheId: z.string().nullable().optional(),
  settings: z.string().optional(),
});
