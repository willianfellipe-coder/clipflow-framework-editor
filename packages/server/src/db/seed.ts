import { db } from './index.js';
import { templates, captionStyles, settings } from './schema.js';
import { nanoid } from 'nanoid';
import { NICHES } from '@clip/shared';
import { eq } from 'drizzle-orm';

// Map niche caption style names to animation types
const nicheCaptionMap: Record<string, { animation: string; highlightColor: string }> = {
  'pop': { animation: 'pop', highlightColor: '#00FF88' },
  'karaoke': { animation: 'karaoke', highlightColor: '#FF4444' },
  'glow': { animation: 'glow', highlightColor: '#8B5CF6' },
  'word-highlight': { animation: 'word-highlight', highlightColor: '#FFD700' },
};

export async function seed() {
  const existing = db.select().from(settings).where(eq(settings.key, 'initialized')).get();
  if (existing) return;

  const now = new Date();

  // Seed caption style presets with IDs we can reference
  const presetStyles = [
    { id: nanoid(), name: 'Word Highlight', animation: 'word-highlight' as const, highlightColor: '#FFD700' },
    { id: nanoid(), name: 'Karaoke', animation: 'karaoke' as const, highlightColor: '#FF4444' },
    { id: nanoid(), name: 'Pop', animation: 'pop' as const, highlightColor: '#00FF88' },
    { id: nanoid(), name: 'Glow', animation: 'glow' as const, highlightColor: '#8B5CF6' },
  ];

  // Build lookup: animation name → caption style ID
  const captionStyleIdMap: Record<string, string> = {};
  for (const style of presetStyles) {
    db.insert(captionStyles).values({
      id: style.id,
      name: style.name,
      isPreset: true,
      animation: style.animation,
      highlightColor: style.highlightColor,
      createdAt: now,
    }).run();
    captionStyleIdMap[style.animation] = style.id;
  }

  // Seed built-in templates with FULL configuration
  for (const [nicheId, niche] of Object.entries(NICHES)) {
    const captionAnim = nicheCaptionMap[niche.captionStyle] || nicheCaptionMap['word-highlight'];
    const captionStyleId = captionStyleIdMap[captionAnim.animation] || captionStyleIdMap['word-highlight'];

    db.insert(templates).values({
      id: nanoid(),
      name: niche.name,
      description: `Default template for ${niche.name} content. Optimized for ${niche.pacing} pacing with ${niche.hookStrategy} hooks.`,
      niche: nicheId,
      isBuiltIn: true,
      isPublished: true,
      composition: 'ReelComposition',
      defaultCaptionStyleId: captionStyleId,
      defaultEffects: JSON.stringify(niche.defaultEffects),
      defaultTransitions: JSON.stringify(niche.defaultTransitions),
      colorPalette: JSON.stringify(niche.colorPalette),
      musicConfig: JSON.stringify({ mood: niche.musicMood }),
      hookConfig: JSON.stringify({
        strategy: niche.hookStrategy,
        durationSeconds: niche.pacing === 'fast' ? 2 : niche.pacing === 'slow' ? 4 : 3,
      }),
      ctaConfig: JSON.stringify({
        style: niche.ctaStyle,
        enabled: true,
        text: getCtaText(niche.ctaStyle),
        durationSeconds: 3,
      }),
      layoutConfig: JSON.stringify({
        pacing: niche.pacing,
        captionPosition: 'bottom',
        showProgressBar: true,
      }),
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  db.insert(settings).values({ key: 'initialized', value: 'true', updatedAt: now }).run();
  console.log('Database seeded with default templates and caption presets');
}

function getCtaText(ctaStyle: string): string {
  const texts: Record<string, string> = {
    follow_for_more: 'Follow for more!',
    link_in_bio: 'Link in bio',
    save_recipe: 'Save this recipe!',
    follow_for_tips: 'Follow for more tips!',
    shop_now: 'Shop now!',
    full_episode_link: 'Full episode in bio',
  };
  return texts[ctaStyle] || 'Follow for more!';
}
