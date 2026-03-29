import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// -- Projects --
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'transcribing', 'analyzing', 'editing', 'rendering', 'done', 'error'],
  }).notNull().default('draft'),
  sourceVideoPath: text('source_video_path').notNull(),
  sourceVideoMeta: text('source_video_meta'),
  thumbnailPath: text('thumbnail_path'),
  templateId: text('template_id').references(() => templates.id),
  nicheId: text('niche_id'),
  settings: text('settings'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// -- Transcriptions --
export const transcriptions = sqliteTable('transcriptions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  model: text('model').notNull().default('large-v3'),
  language: text('language'),
  fullText: text('full_text').notNull(),
  wordTimestamps: text('word_timestamps').notNull(),
  segments: text('segments').notNull(),
  speakers: text('speakers'),
  duration: real('duration').notNull(),
  processingTime: real('processing_time'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// -- AI Analyses --
export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  transcriptionId: text('transcription_id').notNull().references(() => transcriptions.id),
  model: text('model').notNull().default('claude-sonnet-4-6'),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  scenePlan: text('scene_plan').notNull(),
  suggestedCuts: text('suggested_cuts'),
  suggestedEffects: text('suggested_effects'),
  hookAnalysis: text('hook_analysis'),
  ctaAnalysis: text('cta_analysis'),
  contentScore: integer('content_score'),
  tokensUsed: integer('tokens_used'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// -- Scenes --
export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  analysisId: text('analysis_id').references(() => analyses.id),
  order: integer('order').notNull(),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
  type: text('type', {
    enum: ['hook', 'content', 'transition', 'broll', 'cta', 'outro'],
  }).notNull(),
  description: text('description'),
  captionText: text('caption_text'),
  effects: text('effects'),
  zoomConfig: text('zoom_config'),
  transitionIn: text('transition_in'),
  transitionOut: text('transition_out'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// -- Caption Styles --
export const captionStyles = sqliteTable('caption_styles', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  name: text('name').notNull(),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
  fontFamily: text('font_family').notNull().default('Inter'),
  fontSize: integer('font_size').notNull().default(48),
  fontWeight: text('font_weight').notNull().default('800'),
  color: text('color').notNull().default('#FFFFFF'),
  highlightColor: text('highlight_color').notNull().default('#FFD700'),
  strokeColor: text('stroke_color').notNull().default('#000000'),
  strokeWidth: integer('stroke_width').notNull().default(4),
  backgroundColor: text('background_color'),
  backgroundPadding: integer('background_padding'),
  backgroundRadius: integer('background_radius'),
  position: text('position', {
    enum: ['top', 'center', 'bottom'],
  }).notNull().default('bottom'),
  animation: text('animation', {
    enum: ['none', 'word-highlight', 'karaoke', 'pop', 'glow', 'typewriter', 'bounce'],
  }).notNull().default('word-highlight'),
  maxWordsPerLine: integer('max_words_per_line').notNull().default(4),
  shadowConfig: text('shadow_config'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// -- Templates --
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  niche: text('niche').notNull(),
  thumbnail: text('thumbnail'),
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).notNull().default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
  composition: text('composition').notNull(),
  defaultCaptionStyleId: text('default_caption_style_id').references(() => captionStyles.id),
  defaultEffects: text('default_effects'),
  defaultTransitions: text('default_transitions'),
  colorPalette: text('color_palette'),
  musicConfig: text('music_config'),
  hookConfig: text('hook_config'),
  ctaConfig: text('cta_config'),
  layoutConfig: text('layout_config'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// -- Renders --
export const renders = sqliteTable('renders', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  format: text('format', {
    enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5', 'story_9x16'],
  }).notNull(),
  status: text('status', {
    enum: ['queued', 'rendering', 'encoding', 'done', 'error'],
  }).notNull().default('queued'),
  outputPath: text('output_path'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fps: integer('fps').notNull().default(30),
  codec: text('codec').notNull().default('h264'),
  quality: text('quality', {
    enum: ['draft', 'standard', 'high', 'maximum'],
  }).notNull().default('standard'),
  fileSize: integer('file_size'),
  renderTime: real('render_time'),
  progress: real('progress').notNull().default(0),
  errorMessage: text('error_message'),
  compositionProps: text('composition_props'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// -- Batch Jobs --
export const batchJobs = sqliteTable('batch_jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'paused', 'done', 'error'],
  }).notNull().default('pending'),
  templateId: text('template_id').references(() => templates.id),
  captionStyleId: text('caption_style_id').references(() => captionStyles.id),
  formats: text('formats').notNull(),
  totalVideos: integer('total_videos').notNull(),
  completedVideos: integer('completed_videos').notNull().default(0),
  failedVideos: integer('failed_videos').notNull().default(0),
  settings: text('settings'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// -- Batch Items --
export const batchItems = sqliteTable('batch_items', {
  id: text('id').primaryKey(),
  batchJobId: text('batch_job_id').notNull().references(() => batchJobs.id),
  projectId: text('project_id').references(() => projects.id),
  sourceVideoPath: text('source_video_path').notNull(),
  status: text('status', {
    enum: ['pending', 'transcribing', 'analyzing', 'rendering', 'done', 'error'],
  }).notNull().default('pending'),
  errorMessage: text('error_message'),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// -- Settings --
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// -- ClipGen: Clip Analyses --
export const clipAnalyses = sqliteTable('clip_analyses', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  transcriptionId: text('transcription_id').references(() => transcriptions.id),
  targetDuration: integer('target_duration').notNull().default(30),
  numberOfClips: integer('number_of_clips').notNull().default(5),
  targetPlatform: text('target_platform').notNull().default('tiktok'),
  niche: text('niche'),
  tone: text('tone').notNull().default('energetic'),
  customInstructions: text('custom_instructions'),
  rawResponse: text('raw_response'),
  clipsGenerated: integer('clips_generated').notNull().default(0),
  modelUsed: text('model_used'),
  tokensUsed: integer('tokens_used'),
  status: text('status', {
    enum: ['pending', 'processing', 'done', 'error'],
  }).notNull().default('pending'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// -- ClipGen: Clips --
export const clips = sqliteTable('clips', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  analysisId: text('analysis_id').references(() => clipAnalyses.id),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
  title: text('title').notNull().default('Untitled Clip'),
  hookSentence: text('hook_sentence'),
  hookScore: integer('hook_score').notNull().default(0),
  emotionalTone: text('emotional_tone').notNull().default('neutral'),
  suggestedHashtags: text('suggested_hashtags'),
  aiReason: text('ai_reason'),
  captionStyleId: text('caption_style_id').references(() => captionStyles.id),
  captionAnimation: text('caption_animation').notNull().default('word-highlight'),
  aspectRatio: text('aspect_ratio').notNull().default('9:16'),
  zoomConfig: text('zoom_config'),
  ctaConfig: text('cta_config'),
  showProgressBar: integer('show_progress_bar', { mode: 'boolean' }).notNull().default(true),
  status: text('status', {
    enum: ['suggested', 'selected', 'editing', 'queued', 'rendering', 'done', 'error', 'rejected'],
  }).notNull().default('suggested'),
  orderIndex: integer('order_index').notNull().default(0),
  quality: text('quality').notNull().default('standard'),
  outputFormat: text('output_format').notNull().default('mp4'),
  targetPlatform: text('target_platform').notNull().default('tiktok'),
  renderId: text('render_id').references(() => renders.id),
  outputPath: text('output_path'),
  thumbnailPath: text('thumbnail_path'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// -- ClipGen: Presets --
export const clipPresets = sqliteTable('clip_presets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  targetDuration: integer('target_duration').notNull().default(30),
  numberOfClips: integer('number_of_clips').notNull().default(5),
  targetPlatform: text('target_platform').notNull().default('tiktok'),
  niche: text('niche'),
  tone: text('tone').notNull().default('energetic'),
  customInstructions: text('custom_instructions'),
  captionStyleId: text('caption_style_id'),
  captionAnimation: text('caption_animation').notNull().default('word-highlight'),
  zoomConfig: text('zoom_config'),
  ctaConfig: text('cta_config'),
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
