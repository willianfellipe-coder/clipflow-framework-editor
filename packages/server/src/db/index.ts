import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';
import { PATHS } from '../config.js';

const sqlite = new Database(PATHS.db);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

/** Create all tables if they don't exist. */
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      source_video_path TEXT NOT NULL,
      source_video_meta TEXT,
      thumbnail_path TEXT,
      template_id TEXT REFERENCES templates(id),
      niche_id TEXT,
      settings TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcriptions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      model TEXT NOT NULL DEFAULT 'large-v3',
      language TEXT,
      full_text TEXT NOT NULL,
      word_timestamps TEXT NOT NULL,
      segments TEXT NOT NULL,
      speakers TEXT,
      duration REAL NOT NULL,
      processing_time REAL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      transcription_id TEXT NOT NULL REFERENCES transcriptions(id),
      model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      scene_plan TEXT NOT NULL,
      suggested_cuts TEXT,
      suggested_effects TEXT,
      hook_analysis TEXT,
      cta_analysis TEXT,
      content_score INTEGER,
      tokens_used INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      analysis_id TEXT REFERENCES analyses(id),
      "order" INTEGER NOT NULL,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      caption_text TEXT,
      effects TEXT,
      zoom_config TEXT,
      transition_in TEXT,
      transition_out TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS caption_styles (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      name TEXT NOT NULL,
      is_preset INTEGER NOT NULL DEFAULT 0,
      font_family TEXT NOT NULL DEFAULT 'Inter',
      font_size INTEGER NOT NULL DEFAULT 48,
      font_weight TEXT NOT NULL DEFAULT '800',
      color TEXT NOT NULL DEFAULT '#FFFFFF',
      highlight_color TEXT NOT NULL DEFAULT '#FFD700',
      stroke_color TEXT NOT NULL DEFAULT '#000000',
      stroke_width INTEGER NOT NULL DEFAULT 4,
      background_color TEXT,
      background_padding INTEGER,
      background_radius INTEGER,
      position TEXT NOT NULL DEFAULT 'bottom',
      animation TEXT NOT NULL DEFAULT 'word-highlight',
      max_words_per_line INTEGER NOT NULL DEFAULT 4,
      shadow_config TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      niche TEXT NOT NULL,
      thumbnail TEXT,
      is_built_in INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      composition TEXT NOT NULL,
      default_caption_style_id TEXT REFERENCES caption_styles(id),
      default_effects TEXT,
      default_transitions TEXT,
      color_palette TEXT,
      music_config TEXT,
      hook_config TEXT,
      cta_config TEXT,
      layout_config TEXT,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS renders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      output_path TEXT,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      fps INTEGER NOT NULL DEFAULT 30,
      codec TEXT NOT NULL DEFAULT 'h264',
      quality TEXT NOT NULL DEFAULT 'standard',
      file_size INTEGER,
      render_time REAL,
      progress REAL NOT NULL DEFAULT 0,
      error_message TEXT,
      composition_props TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS batch_jobs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      template_id TEXT REFERENCES templates(id),
      caption_style_id TEXT REFERENCES caption_styles(id),
      formats TEXT NOT NULL,
      total_videos INTEGER NOT NULL,
      completed_videos INTEGER NOT NULL DEFAULT 0,
      failed_videos INTEGER NOT NULL DEFAULT 0,
      settings TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS batch_items (
      id TEXT PRIMARY KEY,
      batch_job_id TEXT NOT NULL REFERENCES batch_jobs(id),
      project_id TEXT REFERENCES projects(id),
      source_video_path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      "order" INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- DAT-006: Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_transcriptions_project ON transcriptions(project_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_project ON analyses(project_id);
    CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
    CREATE INDEX IF NOT EXISTS idx_renders_project ON renders(project_id);
    CREATE INDEX IF NOT EXISTS idx_renders_status ON renders(status);
    CREATE INDEX IF NOT EXISTS idx_batch_items_job ON batch_items(batch_job_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);
  `);
}
