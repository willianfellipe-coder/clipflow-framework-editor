/**
 * AI Provider — Abstraction layer for AI analysis
 *
 * Priority order:
 * 1. Claude Code MCP (if running — detected via environment or subprocess)
 * 2. Anthropic API direct (if ANTHROPIC_API_KEY is set)
 * 3. Error (no AI available)
 *
 * When ClipFlow is installed as an MCP tool in Claude Code,
 * the MCP tools handle analysis directly (Claude Code IS the brain).
 *
 * When used from the web UI, this provider routes to the best available AI:
 * - If ANTHROPIC_API_KEY exists → use direct Anthropic SDK
 * - Otherwise → return instructions for the user to use Claude Code
 */

import { config } from '../config.js';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { claudeService, type AnalysisResult } from './claude.service.js';
import { clipGenService } from './clipgen.service.js';
import type { ClipAnalysisRequest, ClipAnalysisResult } from '@clip/shared';
import type { Template } from '@clip/shared';

export type AIMode = 'claude-api' | 'claude-code' | 'none';

const MCP_SETTING_KEY = 'mcp_connected';

interface TranscriptionData {
  segments: { text: string; start: number; end: number; speaker?: string }[];
  wordTimestamps: { word: string; start: number; end: number; confidence: number; speaker?: string }[];
  language: string | null;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

class AIProvider {
  /**
   * Set MCP connection state — persists to DB so it survives server restarts.
   */
  setMcpConnected(connected: boolean) {
    const now = new Date();
    const value = connected ? 'true' : 'false';
    const existing = db.select().from(settings).where(eq(settings.key, MCP_SETTING_KEY)).get();
    if (existing) {
      db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, MCP_SETTING_KEY)).run();
    } else {
      db.insert(settings).values({ key: MCP_SETTING_KEY, value, updatedAt: now }).run();
    }
  }

  /**
   * Check if MCP was marked as connected (reads from DB).
   */
  private isMcpConnected(): boolean {
    const row = db.select().from(settings).where(eq(settings.key, MCP_SETTING_KEY)).get();
    return row?.value === 'true';
  }

  /**
   * Detect which AI mode to use for analysis.
   * Priority: real MCP env vars > API key > manual mcp_connected toggle > none
   */
  getMode(): AIMode {
    // Real Claude Code process (env vars set by the runtime)
    if (process.env.CLAUDE_CODE === 'true' || process.env.MCP_MODE === 'true') {
      return 'claude-code';
    }
    // API key available → use it directly (takes priority over manual toggle)
    if (config.anthropicApiKey) {
      return 'claude-api';
    }
    // Manual UI toggle — claude-code mode but analysis will require API key
    if (this.isMcpConnected()) {
      return 'claude-code';
    }
    return 'none';
  }

  /**
   * Get human-readable status of AI availability.
   * mcpConnected is reported separately from analysis availability.
   */
  getStatus(): { mode: AIMode; available: boolean; mcpConnected: boolean; message: string } {
    const mode = this.getMode();
    const mcpConnected = this.isMcpConnected()
      || process.env.CLAUDE_CODE === 'true'
      || process.env.MCP_MODE === 'true';

    switch (mode) {
      case 'claude-api':
        return { mode, available: true, mcpConnected, message: 'Claude API connected (Anthropic SDK)' };
      case 'claude-code':
        return { mode, available: true, mcpConnected, message: 'Claude Code connected (MCP integration)' };
      case 'none':
        return {
          mode,
          available: false,
          mcpConnected,
          message: 'No AI available. Set ANTHROPIC_API_KEY in .env or use ClipFlow from Claude Code.',
        };
    }
  }

  /**
   * Analyze transcription for video editing scene plan.
   */
  async analyzeForEdit(
    transcription: TranscriptionData,
    template: Template | null,
    niche: string,
    userInstructions?: string,
  ): Promise<AnalysisResult> {
    const mode = this.getMode();

    if (mode === 'claude-api') {
      return claudeService.analyzeForEdit(transcription, template, niche, userInstructions);
    }

    if (mode === 'claude-code') {
      // Real MCP process (env vars set) — API key may still be available for browser-triggered analysis
      if (config.anthropicApiKey) {
        return claudeService.analyzeForEdit(transcription, template, niche, userInstructions);
      }
      throw new Error(
        'Análise via navegador requer ANTHROPIC_API_KEY no .env.\n' +
        'Configure a chave no arquivo .env e reinicie o servidor.\n\n' +
        'Ou use o Claude Code CLI com o MCP tool:\n' +
        'clipflow_analyze_edit (project_id: <id>)',
      );
    }

    throw new Error(
      'Nenhum provedor de IA disponível.\n' +
      'Configure ANTHROPIC_API_KEY no .env ou conecte o Claude Code nas Configurações.',
    );
  }

  /**
   * Analyze transcription for viral clip extraction.
   */
  async analyzeForClips(
    transcription: TranscriptionData,
    analysisConfig: ClipAnalysisRequest,
    videoMeta: VideoMetadata,
  ): Promise<ClipAnalysisResult> {
    const mode = this.getMode();

    if (mode === 'claude-api') {
      return clipGenService.analyzeForClips(transcription, analysisConfig, videoMeta);
    }

    if (mode === 'claude-code') {
      if (config.anthropicApiKey) {
        return clipGenService.analyzeForClips(transcription, analysisConfig, videoMeta);
      }
      throw new Error(
        'Análise via navegador requer ANTHROPIC_API_KEY no .env.\n' +
        'Configure a chave no arquivo .env e reinicie o servidor.\n\n' +
        'Ou use o Claude Code CLI com o MCP tool:\n' +
        'clipflow_analyze_clips (project_id: <id>)',
      );
    }

    throw new Error(
      'Nenhum provedor de IA disponível.\n' +
      'Configure ANTHROPIC_API_KEY no .env ou conecte o Claude Code nas Configurações.',
    );
  }
}

export const aiProvider = new AIProvider();
