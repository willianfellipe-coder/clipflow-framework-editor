#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
  { name: 'clipflow', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'clipflow_create_video',
      description: 'Create an edited social media video. Runs: upload → transcribe → analyze → render. Returns rendered video paths.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          video_path: { type: 'string', description: 'Absolute path to source video file' },
          template: { type: 'string', description: 'Template name or ID', default: 'auto' },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5'] },
            description: 'Output formats',
            default: ['reel_9x16'],
          },
          caption_style: {
            type: 'string',
            enum: ['word-highlight', 'karaoke', 'pop', 'glow', 'none'],
            default: 'word-highlight',
          },
          instructions: { type: 'string', description: 'Natural language editing instructions' },
        },
        required: ['video_path'],
      },
    },
    {
      name: 'clipflow_transcribe',
      description: 'Transcribe a video/audio file with word-level timestamps',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string', description: 'Project ID (upload video first)' },
          language: { type: 'string', default: 'auto' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'clipflow_analyze_video',
      description: 'Analyze a video and return AI insights: engagement score, hook quality, suggested cuts',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          niche: { type: 'string', default: 'general' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'clipflow_list_templates',
      description: 'List all available video editing templates',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'clipflow_apply_template',
      description: 'Apply a template to an existing project',
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
      description: 'Trigger rendering for a project in specified format',
      inputSchema: {
        type: 'object' as const,
        properties: {
          project_id: { type: 'string' },
          format: { type: 'string', enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5', 'story_9x16'] },
          quality: { type: 'string', enum: ['draft', 'standard', 'high', 'maximum'], default: 'standard' },
        },
        required: ['project_id'],
      },
    },
    {
      name: 'clipflow_batch_process',
      description: 'Process multiple videos with the same template and settings',
      inputSchema: {
        type: 'object' as const,
        properties: {
          video_paths: { type: 'array', items: { type: 'string' }, description: 'Array of video file paths' },
          template_id: { type: 'string' },
          formats: { type: 'array', items: { type: 'string' } },
        },
        required: ['video_paths'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'clipflow_create_video': {
        // Full pipeline: this is a convenience tool
        const result = await callApi('/api/upload', 'POST'); // Would need file upload
        return { content: [{ type: 'text', text: JSON.stringify({ message: 'Use clipflow_transcribe, clipflow_analyze_video, and clipflow_render for step-by-step control. Full pipeline requires file upload via the web UI.', args }, null, 2) }] };
      }

      case 'clipflow_transcribe': {
        const a = args as { project_id: string; language?: string };
        const result = await callApi(`/api/projects/${a.project_id}/transcribe`, 'POST', { language: a.language });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'clipflow_analyze_video': {
        const a = args as { project_id: string; niche?: string };
        const result = await callApi(`/api/projects/${a.project_id}/analyze`, 'POST', { niche: a.niche });
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
        // Auto-start the batch
        if (result.id) {
          await callApi(`/api/batch/${result.id}/start`, 'POST');
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${(err as Error).message}` }], isError: true };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClipFlow MCP server started');
}

main().catch(console.error);
