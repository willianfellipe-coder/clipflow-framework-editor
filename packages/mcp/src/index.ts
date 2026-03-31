#!/usr/bin/env node
/**
 * ClipFlow MCP Server — Claude Code / Cursor / Windsurf integration
 *
 * Architecture: MCP-first design where Claude Code IS the AI brain.
 *
 * Two modes of operation:
 * 1. ANALYSIS TOOLS — Claude Code receives transcription data, analyzes it using its
 *    own intelligence, and returns structured JSON (no API key needed)
 * 2. ACTION TOOLS — Proxy to ClipFlow HTTP API for operations like transcribe, render, etc.
 *
 * When used from Claude Code, the AI analysis is done BY Claude Code itself.
 * No ANTHROPIC_API_KEY required — Claude Code is already authenticated.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CreateMessageResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

const CLIPFLOW_URL = process.env.CLIPFLOW_URL || 'http://localhost:4400';

async function callApi(path: string, method: string = 'GET', body?: unknown) {
  const res = await fetch(`${CLIPFLOW_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const server = new Server(
  { name: 'clipflow', version: '2.0.0' },
  { capabilities: { tools: {}, sampling: {} } },
);

// ═══════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── AI Analysis Tools (Claude Code IS the brain) ──────────

    {
      name: 'clipflow_analyze_edit',
      description: `Analyze a video transcription and generate a complete editing scene plan for social media (Reels/TikTok).

You are an expert social media video editor. Analyze the transcription and produce:
- Scene plan with timestamped segments (hook, content, transition, CTA)
- Suggested cuts (remove silence, filler words)
- Hook quality score (0-100) with improvement suggestions
- CTA analysis with suggestions
- Overall engagement score (0-100)

Return ONLY valid JSON matching the specified structure.`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'ClipFlow project ID to load transcription from and save results to' },
          niche: { type: 'string', description: 'Content niche: fitness, tech, food, education, ecommerce, podcast, or general' },
          user_instructions: { type: 'string', description: 'Additional editing instructions from the user' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_analyze_clips',
      description: `Analyze a video transcription to identify viral moments for short-form clips (TikTok/Shorts/Reels).

You are an expert viral content creator. Identify the best moments for short clips:
- Each clip must be self-contained (makes sense in isolation)
- Strong hook in the first sentence
- Clips must not overlap
- Score each clip 0-100 for viral potential
- Suggest hashtags per clip
- Classify emotional tone (humor, drama, surprise, insight, etc.)

Return ONLY valid JSON matching the specified structure.`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'ClipFlow project ID' },
          target_duration: { type: 'number', description: 'Target clip duration in seconds (15, 30, 45, 60)', default: 30 },
          number_of_clips: { type: 'number', description: 'How many clips to identify (1-20)', default: 5 },
          target_platform: { type: 'string', enum: ['tiktok', 'youtube_shorts', 'instagram_reels'], default: 'tiktok' },
          niche: { type: 'string', description: 'Content niche' },
          tone: { type: 'string', description: 'Desired tone: energetic, professional, informal, calm, humorous', default: 'energetic' },
          custom_instructions: { type: 'string', description: 'Additional instructions for clip selection' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_save_analysis',
      description: 'Save a scene plan analysis result back to the ClipFlow server. Use after clipflow_analyze_edit.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          analysis: {
            type: 'object',
            description: 'The analysis result with scenes, suggestedCuts, hookAnalysis, ctaAnalysis, contentScore, summary',
            properties: {
              scenes: { type: 'array', description: 'Array of scene objects with order, startTime, endTime, type, description, effects, transitionIn, transitionOut' },
              suggestedCuts: { type: 'array' },
              suggestedEffects: { type: 'array' },
              hookAnalysis: { type: 'object' },
              ctaAnalysis: { type: 'object' },
              contentScore: { type: 'number' },
              summary: { type: 'string' },
            },
          },
        },
        required: ['project_id', 'analysis'],
      },
    },

    {
      name: 'clipflow_save_clips',
      description: 'Save clip analysis results back to the ClipFlow server. Use after clipflow_analyze_clips.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          target_platform: { type: 'string', default: 'tiktok' },
          clips: {
            type: 'array',
            description: 'Array of clip objects with startTime, endTime, title, hookSentence, hookScore, emotionalTone, suggestedHashtags, reason',
          },
          summary: { type: 'string' },
        },
        required: ['project_id', 'clips'],
      },
    },

    // ── Data Access Tools ─────────────────────────────────────

    {
      name: 'clipflow_get_transcription',
      description: 'Get the transcription (word timestamps + segments) for a project. Use this to feed data to analyze_edit or analyze_clips.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_get_project',
      description: 'Get project details including metadata, status, and template info.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_list_projects',
      description: 'List all projects in ClipFlow with their status.',
      inputSchema: { type: 'object' as const, properties: {} },
    },

    // ── Action Tools (proxy to HTTP API) ──────────────────────

    {
      name: 'clipflow_transcribe',
      description: 'Start WhisperX transcription for a project. The video must be uploaded first.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          language: { type: 'string', description: 'Language code or "auto"', default: 'auto' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_list_templates',
      description: 'List all available video editing templates with niche configurations.',
      inputSchema: { type: 'object' as const, properties: {} },
    },

    {
      name: 'clipflow_apply_template',
      description: 'Apply a template to a project. Updates scenes with template effects, transitions, caption style, CTA config.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          template_id: { type: 'string' },
        },
        required: ['project_id', 'template_id'],
      },
    },

    {
      name: 'clipflow_render',
      description: 'Start rendering a project to video. Supports 5 formats and 4 quality levels.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          format: { type: 'string', enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5', 'story_9x16'], default: 'reel_9x16' },
          quality: { type: 'string', enum: ['draft', 'standard', 'high', 'maximum'], default: 'standard' },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_batch_process',
      description: 'Create and start a batch job to process multiple videos with the same template.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          video_paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to video files' },
          template_id: { type: 'string' },
          formats: { type: 'array', items: { type: 'string' }, default: ['reel_9x16'] },
        },
        required: ['video_paths'],
      },
    },

    // ── Chat Tools (Editor ↔ Claude Code) ────────────────────

    {
      name: 'clipflow_get_chat',
      description: 'Get chat messages for a project. Use this to read user editing instructions from the Editor chat panel.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          pending_only: { type: 'boolean', description: 'If true, only returns messages after the last assistant reply', default: false },
        },
        required: ['project_id'],
      },
    },

    {
      name: 'clipflow_chat_reply',
      description: 'Send a reply message to the project chat. The message appears in the Editor chat panel in real-time.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          message: { type: 'string', description: 'Reply message content' },
        },
        required: ['project_id', 'message'],
      },
    },
  ],
}));

// ═══════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      // ── AI Analysis Tools ───────────────────────────────────

      case 'clipflow_analyze_edit': {
        const a = args as { project_id: string; niche?: string; user_instructions?: string };

        // Load transcription from server
        const transcription = await callApi(`/api/projects/${a.project_id}/transcription`);
        const project = await callApi(`/api/projects/${a.project_id}`);
        const meta = project.sourceVideoMeta ? JSON.parse(project.sourceVideoMeta) : {};

        // Return transcription data to Claude Code — it will analyze and call save_analysis
        return {
          content: [{
            type: 'text',
            text: `## ClipFlow Analysis Request

**Project:** ${project.name} (${a.project_id})
**Duration:** ${meta.duration?.toFixed(1) || '?'}s | **Resolution:** ${meta.width || '?'}x${meta.height || '?'}
**Niche:** ${a.niche || project.nicheId || 'general'}
${a.user_instructions ? `**Instructions:** ${a.user_instructions}` : ''}

### Transcription (${transcription.segments?.length || 0} segments, ${transcription.wordTimestamps?.length || 0} words)

${(transcription.segments || []).map((s: { start: number; end: number; text: string; speaker?: string }) =>
  `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.speaker ? `(${s.speaker}) ` : ''}${s.text}`
).join('\n')}

---

**Analyze this transcription and return JSON with this structure:**

\`\`\`json
{
  "scenes": [{"order": 1, "startTime": 0.0, "endTime": 2.5, "type": "hook|content|transition|broll|cta|outro", "description": "...", "effects": [], "transitionIn": "cut", "transitionOut": "cut"}],
  "suggestedCuts": [{"start": 0, "end": 0, "reason": "..."}],
  "suggestedEffects": [{"timestamp": 0, "effect": "zoom_punch", "reason": "..."}],
  "hookAnalysis": {"score": 0, "currentHook": "...", "suggestion": "..."},
  "ctaAnalysis": {"score": 0, "hasCta": false, "suggestion": "..."},
  "contentScore": 0,
  "summary": "..."
}
\`\`\`

After generating the analysis, call **clipflow_save_analysis** with project_id="${a.project_id}" and the analysis JSON to save it.`,
          }],
        };
      }

      case 'clipflow_analyze_clips': {
        const a = args as { project_id: string; target_duration?: number; number_of_clips?: number; target_platform?: string; niche?: string; tone?: string; custom_instructions?: string };

        const transcription = await callApi(`/api/projects/${a.project_id}/transcription`);
        const project = await callApi(`/api/projects/${a.project_id}`);
        const meta = project.sourceVideoMeta ? JSON.parse(project.sourceVideoMeta) : {};

        const platform = a.target_platform || 'tiktok';
        const duration = a.target_duration || 30;
        const count = a.number_of_clips || 5;

        return {
          content: [{
            type: 'text',
            text: `## ClipGen Analysis Request

**Project:** ${project.name} | **Platform:** ${platform} | **Target:** ${count} clips of ~${duration}s
**Tone:** ${a.tone || 'energetic'} | **Niche:** ${a.niche || 'general'}
${a.custom_instructions ? `**Instructions:** ${a.custom_instructions}` : ''}
**Video:** ${meta.duration?.toFixed(1) || '?'}s

### Transcription

${(transcription.segments || []).map((s: { start: number; end: number; text: string; speaker?: string }) =>
  `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.speaker ? `(${s.speaker}) ` : ''}${s.text}`
).join('\n')}

---

**Identify the ${count} best moments for ${platform} clips (~${duration}s each). Return JSON:**

\`\`\`json
{
  "clips": [{"startTime": 0, "endTime": 30, "title": "...", "hookSentence": "...", "hookScore": 85, "emotionalTone": "insight", "suggestedHashtags": ["tag1"], "reason": "..."}],
  "summary": "...",
  "totalMomentsFound": 0
}
\`\`\`

After generating clips, call **clipflow_save_clips** with project_id="${a.project_id}" and the clips array to save them.`,
          }],
        };
      }

      case 'clipflow_save_analysis': {
        const a = args as { project_id: string; analysis: Record<string, unknown> };
        const result = await callApi(`/api/projects/${a.project_id}/analysis/save`, 'POST', a.analysis);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_save_clips': {
        const a = args as { project_id: string; clips: unknown[]; target_platform?: string; summary?: string };
        const result = await callApi(`/api/clips/save/${a.project_id}`, 'POST', {
          clips: a.clips,
          targetPlatform: a.target_platform || 'tiktok',
          summary: a.summary,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // ── Data Access Tools ───────────────────────────────────

      case 'clipflow_get_transcription': {
        const a = args as { project_id: string };
        const result = await callApi(`/api/projects/${a.project_id}/transcription`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_get_project': {
        const a = args as { project_id: string };
        const result = await callApi(`/api/projects/${a.project_id}`);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_list_projects': {
        const result = await callApi('/api/projects');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // ── Action Tools ────────────────────────────────────────

      case 'clipflow_transcribe': {
        const a = args as { project_id: string; language?: string };
        const result = await callApi(`/api/projects/${a.project_id}/transcribe`, 'POST', { language: a.language });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_list_templates': {
        const result = await callApi('/api/templates');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_apply_template': {
        const a = args as { project_id: string; template_id: string };
        const result = await callApi(`/api/projects/${a.project_id}/apply-template`, 'POST', { templateId: a.template_id });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_render': {
        const a = args as { project_id: string; format?: string; quality?: string };
        const result = await callApi(`/api/projects/${a.project_id}/render`, 'POST', {
          format: a.format || 'reel_9x16',
          quality: a.quality || 'standard',
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_batch_process': {
        const a = args as { video_paths: string[]; template_id?: string; formats?: string[] };
        const result = await callApi('/api/batch', 'POST', {
          name: `MCP Batch ${new Date().toISOString()}`,
          videoPaths: a.video_paths,
          templateId: a.template_id,
          formats: a.formats || ['reel_9x16'],
        });
        if (result.id) await callApi(`/api/batch/${result.id}/start`, 'POST');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // ── Chat Tools ──────────────────────────────────────────

      case 'clipflow_get_chat': {
        const a = args as { project_id: string; pending_only?: boolean };
        const endpoint = a.pending_only
          ? `/api/projects/${a.project_id}/chat/pending`
          : `/api/projects/${a.project_id}/chat`;
        const result = await callApi(endpoint);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_chat_reply': {
        const a = args as { project_id: string; message: string };
        const result = await callApi(`/api/projects/${a.project_id}/chat`, 'POST', {
          role: 'assistant',
          content: a.message,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${(err as Error).message}` }], isError: true };
  }
});

// Notify ClipFlow server that MCP is connected
async function notifyMcpConnected() {
  try {
    await fetch(`${CLIPFLOW_URL}/api/settings/mcp-connected`, { method: 'POST' });
  } catch {
    // Server may not be running yet — not critical
  }
}

// Extract JSON from a Claude response (strips markdown code blocks if present)
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text.trim();
}

// Process a pending_mcp analysis using MCP sampling (no API key needed)
let processingMcp = false;

async function processMcpAnalysis(project: Record<string, unknown>) {
  if (processingMcp) return;
  processingMcp = true;

  const projectId = project.id as string;
  const niche = (project.nicheId as string) || 'general';

  try {
    // Fetch transcription
    const transcription = await callApi(`/api/projects/${projectId}/transcription`);
    if (!transcription?.segments?.length) {
      throw new Error('Transcrição não encontrada ou vazia.');
    }

    // Build analysis prompt (same content as clipflow_analyze_edit tool)
    const segmentText = (transcription.segments as { start: number; end: number; text: string; speaker?: string }[])
      .map((s) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s] ${s.speaker ? `(${s.speaker}) ` : ''}${s.text}`)
      .join('\n');

    const prompt = `Você é um especialista em edição de vídeos para redes sociais (Reels/TikTok).

**Projeto:** ${project.name || projectId}
**Nicho:** ${niche}
**Duração do vídeo:** ${transcription.duration?.toFixed(1) || '?'}s

### Transcrição (${transcription.segments?.length || 0} segmentos)

${segmentText}

---

Analise esta transcrição e retorne SOMENTE um JSON válido com esta estrutura:

\`\`\`json
{
  "scenes": [{"order": 1, "startTime": 0.0, "endTime": 2.5, "type": "hook|content|transition|broll|cta|outro", "description": "...", "effects": [], "transitionIn": "cut", "transitionOut": "cut"}],
  "suggestedCuts": [{"start": 0, "end": 0, "reason": "..."}],
  "suggestedEffects": [{"timestamp": 0, "effect": "zoom_punch", "reason": "..."}],
  "hookAnalysis": {"score": 0, "currentHook": "...", "suggestion": "..."},
  "ctaAnalysis": {"score": 0, "hasCta": false, "suggestion": "..."},
  "contentScore": 0,
  "summary": "..."
}
\`\`\``;

    // Use MCP sampling — ask Claude Code to generate the analysis (90s timeout)
    const samplingPromise = server.request(
      {
        method: 'sampling/createMessage',
        params: {
          messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
          maxTokens: 4096,
        },
      },
      CreateMessageResultSchema,
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MCP sampling timeout (90s) — Claude Code não respondeu')), 90_000),
    );
    const result = await Promise.race([samplingPromise, timeoutPromise]);

    const responseText = result.content.type === 'text' ? result.content.text : '';
    const analysis = JSON.parse(extractJson(responseText));

    // Save analysis via HTTP API
    await callApi(`/api/projects/${projectId}/analysis/save`, 'POST', analysis);

  } catch (err) {
    // Mark project as error so user can retry
    try {
      await callApi(`/api/projects/${projectId}`, 'PATCH', { status: 'error' });
    } catch { /* ignore */ }
    console.error(`[ClipFlow MCP] Analysis failed for ${projectId}:`, err);
  } finally {
    processingMcp = false;
  }
}

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClipFlow MCP server v2.0 started (Claude Code integration)');
  notifyMcpConnected();
}

main().catch(console.error);
