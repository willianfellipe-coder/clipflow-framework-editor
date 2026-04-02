CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`transcription_id` text NOT NULL,
	`model` text DEFAULT 'claude-sonnet-4-6' NOT NULL,
	`prompt` text NOT NULL,
	`response` text NOT NULL,
	`scene_plan` text NOT NULL,
	`suggested_cuts` text,
	`suggested_effects` text,
	`hook_analysis` text,
	`cta_analysis` text,
	`content_score` integer,
	`tokens_used` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transcription_id`) REFERENCES `transcriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_analyses_project_id` ON `analyses` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_analyses_transcription_id` ON `analyses` (`transcription_id`);--> statement-breakpoint
CREATE TABLE `batch_items` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_job_id` text NOT NULL,
	`project_id` text,
	`source_video_path` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`batch_job_id`) REFERENCES `batch_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `batch_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`template_id` text,
	`caption_style_id` text,
	`formats` text NOT NULL,
	`total_videos` integer NOT NULL,
	`completed_videos` integer DEFAULT 0 NOT NULL,
	`failed_videos` integer DEFAULT 0 NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`caption_style_id`) REFERENCES `caption_styles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `caption_styles` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`is_preset` integer DEFAULT false NOT NULL,
	`font_family` text DEFAULT 'Inter' NOT NULL,
	`font_size` integer DEFAULT 48 NOT NULL,
	`font_weight` text DEFAULT '800' NOT NULL,
	`color` text DEFAULT '#FFFFFF' NOT NULL,
	`highlight_color` text DEFAULT '#FFD700' NOT NULL,
	`stroke_color` text DEFAULT '#000000' NOT NULL,
	`stroke_width` integer DEFAULT 4 NOT NULL,
	`background_color` text,
	`background_padding` integer,
	`background_radius` integer,
	`position` text DEFAULT 'bottom' NOT NULL,
	`animation` text DEFAULT 'word-highlight' NOT NULL,
	`max_words_per_line` integer DEFAULT 4 NOT NULL,
	`shadow_config` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_caption_styles_project_id` ON `caption_styles` (`project_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_project_id` ON `chat_messages` (`project_id`);--> statement-breakpoint
CREATE TABLE `clip_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`transcription_id` text,
	`target_duration` integer DEFAULT 30 NOT NULL,
	`number_of_clips` integer DEFAULT 5 NOT NULL,
	`target_platform` text DEFAULT 'tiktok' NOT NULL,
	`niche` text,
	`tone` text DEFAULT 'energetic' NOT NULL,
	`custom_instructions` text,
	`raw_response` text,
	`clips_generated` integer DEFAULT 0 NOT NULL,
	`model_used` text,
	`tokens_used` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transcription_id`) REFERENCES `transcriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clip_analyses_project_id` ON `clip_analyses` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_clip_analyses_transcription_id` ON `clip_analyses` (`transcription_id`);--> statement-breakpoint
CREATE TABLE `clip_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_duration` integer DEFAULT 30 NOT NULL,
	`number_of_clips` integer DEFAULT 5 NOT NULL,
	`target_platform` text DEFAULT 'tiktok' NOT NULL,
	`niche` text,
	`tone` text DEFAULT 'energetic' NOT NULL,
	`custom_instructions` text,
	`caption_style_id` text,
	`caption_animation` text DEFAULT 'word-highlight' NOT NULL,
	`zoom_config` text,
	`cta_config` text,
	`is_built_in` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`analysis_id` text,
	`start_time` real NOT NULL,
	`end_time` real NOT NULL,
	`title` text DEFAULT 'Untitled Clip' NOT NULL,
	`hook_sentence` text,
	`hook_score` integer DEFAULT 0 NOT NULL,
	`emotional_tone` text DEFAULT 'neutral' NOT NULL,
	`suggested_hashtags` text,
	`ai_reason` text,
	`caption_style_id` text,
	`caption_animation` text DEFAULT 'word-highlight' NOT NULL,
	`aspect_ratio` text DEFAULT '9:16' NOT NULL,
	`zoom_config` text,
	`cta_config` text,
	`show_progress_bar` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'suggested' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`quality` text DEFAULT 'standard' NOT NULL,
	`output_format` text DEFAULT 'mp4' NOT NULL,
	`target_platform` text DEFAULT 'tiktok' NOT NULL,
	`render_id` text,
	`output_path` text,
	`thumbnail_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`analysis_id`) REFERENCES `clip_analyses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`caption_style_id`) REFERENCES `caption_styles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`render_id`) REFERENCES `renders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clips_project_id` ON `clips` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_clips_analysis_id` ON `clips` (`analysis_id`);--> statement-breakpoint
CREATE INDEX `idx_clips_render_id` ON `clips` (`render_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_video_path` text NOT NULL,
	`source_video_meta` text,
	`thumbnail_path` text,
	`template_id` text,
	`niche_id` text,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `renders` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`output_path` text,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`fps` integer DEFAULT 30 NOT NULL,
	`codec` text DEFAULT 'h264' NOT NULL,
	`quality` text DEFAULT 'standard' NOT NULL,
	`file_size` integer,
	`render_time` real,
	`progress` real DEFAULT 0 NOT NULL,
	`error_message` text,
	`composition_props` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_renders_project_id` ON `renders` (`project_id`);--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`analysis_id` text,
	`order` integer NOT NULL,
	`start_time` real NOT NULL,
	`end_time` real NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`caption_text` text,
	`effects` text,
	`zoom_config` text,
	`transition_in` text,
	`transition_out` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_scenes_project_id` ON `scenes` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_scenes_analysis_id` ON `scenes` (`analysis_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`niche` text NOT NULL,
	`thumbnail` text,
	`is_built_in` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`composition` text NOT NULL,
	`default_caption_style_id` text,
	`default_effects` text,
	`default_transitions` text,
	`color_palette` text,
	`music_config` text,
	`hook_config` text,
	`cta_config` text,
	`layout_config` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`default_caption_style_id`) REFERENCES `caption_styles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`model` text DEFAULT 'large-v3' NOT NULL,
	`language` text,
	`full_text` text NOT NULL,
	`word_timestamps` text NOT NULL,
	`segments` text NOT NULL,
	`speakers` text,
	`duration` real NOT NULL,
	`processing_time` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transcriptions_project_id` ON `transcriptions` (`project_id`);