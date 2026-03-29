import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { ClipAnalysisRequest, ClipAnalysisResult, SuggestedClip } from '@clip/shared';

interface TranscriptionData {
  segments: { text: string; start: number; end: number; speaker?: string }[];
  wordTimestamps: { word: string; start: number; end: number; confidence: number }[];
  language: string | null;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export class ClipGenService {
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

  async analyzeForClips(
    transcription: TranscriptionData,
    analysisConfig: ClipAnalysisRequest,
    videoMeta: VideoMetadata,
  ): Promise<ClipAnalysisResult> {
    const client = this.getClient();

    const { targetDuration, numberOfClips, targetPlatform, niche, tone, customInstructions } = analysisConfig;
    const minDuration = Math.max(10, targetDuration - 15);
    const maxDuration = targetDuration + 15;

    // Format transcription with timestamps for Claude
    const formattedTranscription = transcription.segments
      .map((s) => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.speaker ? `(${s.speaker}) ` : ''}${s.text}`)
      .join('\n');

    const platformNames: Record<string, string> = {
      tiktok: 'TikTok',
      youtube_shorts: 'YouTube Shorts',
      instagram_reels: 'Instagram Reels',
    };

    const systemPrompt = `You are an expert viral content creator for ${platformNames[targetPlatform] || targetPlatform}.
Your task is to analyze a video transcription and identify the ${numberOfClips} moments with the highest potential for short clips of approximately ${targetDuration}s.

SELECTION RULES:
1. Each clip MUST be self-contained (makes sense in isolation, without external context)
2. The beginning of each clip must have a strong HOOK (question, impactful statement, revelation)
3. Avoid clips that start in the middle of a sentence or thought
4. Prioritize moments with high emotional or informational charge
5. Timestamps MUST align with natural speech pauses
6. Clips MUST NOT overlap (no timestamp overlap)
7. Each clip must be between ${minDuration}s and ${maxDuration}s
8. Clips must start and end at word boundaries from the transcription

${niche ? `NICHE: ${niche}` : ''}
TONE: ${tone || 'energetic'}
${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ''}

VIDEO DURATION: ${videoMeta.duration.toFixed(1)}s
VIDEO RESOLUTION: ${videoMeta.width}x${videoMeta.height}

IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this transcription and identify the ${numberOfClips} best moments for ${platformNames[targetPlatform] || targetPlatform} clips of ~${targetDuration}s.

TRANSCRIPTION WITH TIMESTAMPS:
${formattedTranscription}

Return this exact JSON structure:
{
  "clips": [
    {
      "startTime": 45.2,
      "endTime": 73.8,
      "title": "descriptive title (max 60 chars)",
      "hookSentence": "opening sentence to retain audience",
      "hookScore": 85,
      "emotionalTone": "humor|drama|surprise|insight|controversy|inspiration|educational|neutral",
      "suggestedHashtags": ["tag1", "tag2", "tag3"],
      "reason": "why this moment was selected"
    }
  ],
  "summary": "analysis summary",
  "totalMomentsFound": 12
}

Order clips by hookScore descending.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned) as ClipAnalysisResult;

    // Align timestamps with word-level boundaries
    result.clips = result.clips.map((clip) => this.alignTimestamps(clip, transcription.wordTimestamps));

    return result;
  }

  /**
   * Snap clip start/end to nearest word boundaries from WhisperX timestamps.
   */
  private alignTimestamps(
    clip: SuggestedClip,
    wordTimestamps: { start: number; end: number }[],
  ): SuggestedClip {
    if (wordTimestamps.length === 0) return clip;

    // Find nearest word start for clip start
    let nearestStart = clip.startTime;
    let minStartDist = Infinity;
    for (const w of wordTimestamps) {
      const dist = Math.abs(w.start - clip.startTime);
      if (dist < minStartDist) {
        minStartDist = dist;
        nearestStart = w.start;
      }
    }

    // Find nearest word end for clip end
    let nearestEnd = clip.endTime;
    let minEndDist = Infinity;
    for (const w of wordTimestamps) {
      const dist = Math.abs(w.end - clip.endTime);
      if (dist < minEndDist) {
        minEndDist = dist;
        nearestEnd = w.end;
      }
    }

    return { ...clip, startTime: nearestStart, endTime: nearestEnd };
  }
}

export const clipGenService = new ClipGenService();
