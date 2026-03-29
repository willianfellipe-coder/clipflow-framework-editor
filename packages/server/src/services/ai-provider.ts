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
import { claudeService, type AnalysisResult } from './claude.service.js';
import { clipGenService } from './clipgen.service.js';
import type { ClipAnalysisRequest, ClipAnalysisResult } from '@clip/shared';
import type { Template } from '@clip/shared';

export type AIMode = 'claude-api' | 'claude-code' | 'none';

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
   * Detect which AI mode is available.
   */
  getMode(): AIMode {
    // Check if running inside Claude Code MCP context
    if (process.env.CLAUDE_CODE === 'true' || process.env.MCP_MODE === 'true') {
      return 'claude-code';
    }

    // Check if API key is available
    if (config.anthropicApiKey) {
      return 'claude-api';
    }

    return 'none';
  }

  /**
   * Get human-readable status of AI availability.
   */
  getStatus(): { mode: AIMode; available: boolean; message: string } {
    const mode = this.getMode();

    switch (mode) {
      case 'claude-api':
        return { mode, available: true, message: 'Claude API connected (Anthropic SDK)' };
      case 'claude-code':
        return { mode, available: true, message: 'Claude Code connected (MCP integration)' };
      case 'none':
        return {
          mode,
          available: false,
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
      // In Claude Code MCP mode, the analysis is done by the MCP tool
      // This path shouldn't normally be reached — Claude Code calls save_analysis directly
      return claudeService.analyzeForEdit(transcription, template, niche, userInstructions);
    }

    throw new Error(
      'No AI provider available. Options:\n' +
      '1. Set ANTHROPIC_API_KEY in your .env file\n' +
      '2. Use ClipFlow from Claude Code (install as MCP tool: claude mcp add clipflow -- npx @clip/mcp)',
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
      return clipGenService.analyzeForClips(transcription, analysisConfig, videoMeta);
    }

    throw new Error(
      'No AI provider available. Options:\n' +
      '1. Set ANTHROPIC_API_KEY in your .env file\n' +
      '2. Use ClipFlow from Claude Code (install as MCP tool)',
    );
  }
}

export const aiProvider = new AIProvider();
