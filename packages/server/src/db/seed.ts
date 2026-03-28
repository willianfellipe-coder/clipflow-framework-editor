import { db } from './index.js';
import { templates, captionStyles, settings } from './schema.js';
import { nanoid } from 'nanoid';
import { NICHES } from '@clip/shared';
import { eq } from 'drizzle-orm';

export async function seed() {
  // Check if already seeded
  const existing = db.select().from(settings).where(eq(settings.key, 'initialized')).get();
  if (existing) return;

  const now = new Date();

  // Seed caption style presets
  const presetStyles = [
    { id: nanoid(), name: 'Word Highlight', animation: 'word-highlight' as const, highlightColor: '#FFD700' },
    { id: nanoid(), name: 'Karaoke', animation: 'karaoke' as const, highlightColor: '#FF4444' },
    { id: nanoid(), name: 'Pop', animation: 'pop' as const, highlightColor: '#00FF88' },
    { id: nanoid(), name: 'Glow', animation: 'glow' as const, highlightColor: '#8B5CF6' },
  ];

  for (const style of presetStyles) {
    db.insert(captionStyles).values({
      id: style.id,
      name: style.name,
      isPreset: true,
      animation: style.animation,
      highlightColor: style.highlightColor,
      createdAt: now,
    }).run();
  }

  // Seed built-in templates (one per niche)
  for (const [nicheId, niche] of Object.entries(NICHES)) {
    db.insert(templates).values({
      id: nanoid(),
      name: niche.name,
      description: `Default template for ${niche.name} content`,
      niche: nicheId,
      isBuiltIn: true,
      isPublished: true,
      composition: 'ReelComposition',
      defaultEffects: JSON.stringify(niche.defaultEffects),
      defaultTransitions: JSON.stringify(niche.defaultTransitions),
      colorPalette: JSON.stringify(niche.colorPalette),
      hookConfig: JSON.stringify({ strategy: niche.hookStrategy }),
      ctaConfig: JSON.stringify({ style: niche.ctaStyle }),
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  // Mark as initialized
  db.insert(settings).values({
    key: 'initialized',
    value: 'true',
    updatedAt: now,
  }).run();

  console.log('Database seeded with default templates and caption presets');
}
