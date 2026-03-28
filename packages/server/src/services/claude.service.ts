import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { NICHES } from '@clip/shared';
import type { Template } from '@clip/shared';

interface TranscriptionData {
  segments: { text: string; start: number; end: number; speaker?: string }[];
  wordTimestamps: { word: string; start: number; end: number; confidence: number; speaker?: string }[];
  language: string | null;
}

export interface AnalysisResult {
  scenes: {
    order: number;
    startTime: number;
    endTime: number;
    type: 'hook' | 'content' | 'transition' | 'broll' | 'cta' | 'outro';
    description: string;
    effects: string[];
    transitionIn: string;
    transitionOut: string;
  }[];
  suggestedCuts: { start: number; end: number; reason: string }[];
  suggestedEffects: { timestamp: number; effect: string; reason: string }[];
  hookAnalysis: {
    score: number;
    currentHook: string;
    suggestion: string;
  };
  ctaAnalysis: {
    score: number;
    hasCta: boolean;
    suggestion: string;
  };
  contentScore: number;
  summary: string;
}

export class ClaudeService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      if (!config.anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured. Set it in your .env file.');
      }
      this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    }
    return this.client;
  }

  async analyzeForEdit(
    transcription: TranscriptionData,
    template: Template | null,
    niche: string,
    userInstructions?: string,
  ): Promise<AnalysisResult> {
    const client = this.getClient();
    const nicheConfig = NICHES[niche as keyof typeof NICHES];

    const systemPrompt = `You are ClipFlow, an expert social media video editor AI.
Your job is to analyze a video transcription and produce a detailed editing plan
optimized for maximum engagement on Instagram Reels and TikTok.

You understand:
- Hook theory: first 1-3 seconds must grab attention
- Pacing: social media videos need fast cuts (2-5 second scenes)
- Silence removal: dead air kills retention
- Caption timing: words must sync perfectly with speech
- CTA placement: end with clear call-to-action
- Platform-specific best practices (Reels vs TikTok nuances)

${nicheConfig ? `NICHE: ${nicheConfig.name}
Default pacing: ${nicheConfig.pacing}
Hook strategy: ${nicheConfig.hookStrategy}
CTA style: ${nicheConfig.ctaStyle}
Default effects: ${JSON.stringify(nicheConfig.defaultEffects)}
Default transitions: ${JSON.stringify(nicheConfig.defaultTransitions)}
Caption style: ${nicheConfig.captionStyle}` : `NICHE: ${niche || 'general'}`}

${template ? `TEMPLATE CONTEXT:
Hook config: ${template.hookConfig || 'default'}
CTA config: ${template.ctaConfig || 'default'}
Effects: ${template.defaultEffects || 'none'}
Transitions: ${template.defaultTransitions || 'none'}` : ''}

${userInstructions ? `USER INSTRUCTIONS: ${userInstructions}` : ''}

IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this transcription and generate a complete edit plan.

TRANSCRIPTION SEGMENTS:
${JSON.stringify(transcription.segments, null, 2)}

WORD TIMESTAMPS (first 200 words):
${JSON.stringify(transcription.wordTimestamps.slice(0, 200), null, 2)}

Total duration: ${transcription.segments.length > 0 ? transcription.segments[transcription.segments.length - 1].end : 0} seconds
Language: ${transcription.language || 'auto-detected'}

Respond with this exact JSON structure:
{
  "scenes": [
    {
      "order": 1,
      "startTime": 0.0,
      "endTime": 2.5,
      "type": "hook",
      "description": "Opening hook — zoom in on speaker's face",
      "effects": ["zoom_punch"],
      "transitionIn": "cut",
      "transitionOut": "cut"
    }
  ],
  "suggestedCuts": [
    { "start": 5.2, "end": 6.8, "reason": "silence / filler word" }
  ],
  "suggestedEffects": [
    { "timestamp": 0.0, "effect": "zoom_punch", "reason": "create urgency on hook" }
  ],
  "hookAnalysis": {
    "score": 85,
    "currentHook": "first sentence text",
    "suggestion": "Consider starting with the key statistic for more impact"
  },
  "ctaAnalysis": {
    "score": 70,
    "hasCta": true,
    "suggestion": "Add text overlay CTA in last 3 seconds"
  },
  "contentScore": 82,
  "summary": "2-sentence summary of the video's content and target audience"
}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON — strip markdown code blocks if present
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned) as AnalysisResult;

    return result;
  }

  async optimizeCaptions(
    wordTimestamps: { word: string; start: number; end: number }[],
    style: 'verbatim' | 'clean' | 'punchy',
  ): Promise<{ text: string; start: number; end: number }[]> {
    const client = this.getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You optimize video captions for social media. Style: ${style}.
- verbatim: keep exactly as spoken
- clean: remove filler words (um, uh, like, you know), fix minor grammar
- punchy: shorten and punch up for maximum impact

Group words into caption lines of max 4 words each. Return JSON array.
IMPORTANT: Respond with ONLY valid JSON, no markdown.`,
      messages: [{
        role: 'user',
        content: `Optimize these word timestamps into caption lines:
${JSON.stringify(wordTimestamps.slice(0, 300))}

Return: [{ "text": "caption line", "start": 0.0, "end": 1.5 }]`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }
}

export const claudeService = new ClaudeService();
