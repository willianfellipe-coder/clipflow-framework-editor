export const QUALITY_PRESETS = {
  draft: {
    label: 'Draft',
    description: 'Fast preview, lower quality',
    crf: 28,
    concurrency: 4,
  },
  standard: {
    label: 'Standard',
    description: 'Balanced quality and speed',
    crf: 23,
    concurrency: 2,
  },
  high: {
    label: 'High',
    description: 'Better quality, slower render',
    crf: 18,
    concurrency: 1,
  },
  maximum: {
    label: 'Maximum',
    description: 'Best quality, slowest render',
    crf: 15,
    concurrency: 1,
  },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;
