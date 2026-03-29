import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { projects, transcriptions, analyses, scenes, templates } from '../db/schema.js';
import { eq, desc, and, ne } from 'drizzle-orm';
import { aiProvider } from '../services/ai-provider.js';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';

export async function analysisRoutes(app: FastifyInstance) {
  // Trigger AI analysis
  app.post<{
    Params: { id: string };
    Body: { niche?: string; templateId?: string; instructions?: string };
  }>('/api/projects/:id/analyze', async (request, reply) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    // Check transcription exists
    const transcription = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, project.id))
      .get();
    if (!transcription) {
      throw new AppError(400, 'Transcription required before analysis. Run transcription first.', 'NO_TRANSCRIPTION');
    }

    // DAT-001: Atomic status update to prevent race conditions
    const updated = db.update(projects)
      .set({ status: 'analyzing', updatedAt: new Date() })
      .where(and(eq(projects.id, project.id), ne(projects.status, 'analyzing')))
      .run();
    if (updated.changes === 0) {
      throw new AppError(409, 'Analysis already in progress', 'ALREADY_ANALYZING');
    }

    reply.status(202).send({ message: 'Analysis started', projectId: project.id });

    // Run analysis in background
    const body = request.body || {};
    processAnalysis(
      project.id,
      transcription,
      body.niche || project.nicheId || 'general',
      body.templateId || project.templateId || null,
      body.instructions,
    ).catch((err) => {
      app.log.error(err, 'Analysis failed');
      db.update(projects)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(projects.id, project.id))
        .run();
      broadcast('analysis:error', { projectId: project.id, error: String(err.message || err) });
    });
  });

  // Get analysis result
  app.get<{ Params: { id: string } }>('/api/projects/:id/analysis', async (request) => {
    const row = db.select().from(analyses)
      .where(eq(analyses.projectId, request.params.id))
      .orderBy(desc(analyses.createdAt))
      .get();

    if (!row) throw new AppError(404, 'No analysis found for this project', 'NOT_FOUND');

    return {
      ...row,
      scenePlan: JSON.parse(row.scenePlan),
      suggestedCuts: row.suggestedCuts ? JSON.parse(row.suggestedCuts) : null,
      suggestedEffects: row.suggestedEffects ? JSON.parse(row.suggestedEffects) : null,
      hookAnalysis: row.hookAnalysis ? JSON.parse(row.hookAnalysis) : null,
      ctaAnalysis: row.ctaAnalysis ? JSON.parse(row.ctaAnalysis) : null,
    };
  });

  // Save analysis result from MCP/external source (Claude Code integration)
  app.post<{
    Params: { id: string };
    Body: {
      scenes: { order: number; startTime: number; endTime: number; type: string; description?: string; effects?: string[]; transitionIn?: string; transitionOut?: string }[];
      suggestedCuts?: { start: number; end: number; reason: string }[];
      suggestedEffects?: { timestamp: number; effect: string; reason: string }[];
      hookAnalysis?: { score: number; currentHook: string; suggestion: string };
      ctaAnalysis?: { score: number; hasCta: boolean; suggestion: string };
      contentScore?: number;
      summary?: string;
    };
  }>('/api/projects/:id/analysis/save', async (request) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const body = request.body;
    const now = new Date();
    const analysisId = nanoid();

    // Find or create transcription (required by FK constraint)
    let transcription = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, project.id)).get();

    if (!transcription) {
      const tid = nanoid();
      db.insert(transcriptions).values({
        id: tid, projectId: project.id, model: 'mcp-placeholder',
        fullText: '', wordTimestamps: '[]', segments: '[]', duration: 0, createdAt: now,
      }).run();
      transcription = db.select().from(transcriptions).where(eq(transcriptions.id, tid)).get()!;
    }

    // Save analysis
    db.insert(analyses).values({
      id: analysisId,
      projectId: project.id,
      transcriptionId: transcription.id,
      model: 'claude-code-mcp',
      prompt: 'Analysis via Claude Code MCP integration',
      response: JSON.stringify(body),
      scenePlan: JSON.stringify(body.scenes || []),
      suggestedCuts: JSON.stringify(body.suggestedCuts || []),
      suggestedEffects: JSON.stringify(body.suggestedEffects || []),
      hookAnalysis: body.hookAnalysis ? JSON.stringify(body.hookAnalysis) : null,
      ctaAnalysis: body.ctaAnalysis ? JSON.stringify(body.ctaAnalysis) : null,
      contentScore: body.contentScore || null,
      createdAt: now,
    }).run();

    // Auto-generate scene rows
    db.delete(scenes).where(eq(scenes.projectId, project.id)).run();
    for (const scene of (body.scenes || [])) {
      db.insert(scenes).values({
        id: nanoid(),
        projectId: project.id,
        analysisId,
        order: scene.order,
        startTime: scene.startTime,
        endTime: scene.endTime,
        type: scene.type as 'hook' | 'content' | 'transition' | 'broll' | 'cta' | 'outro',
        description: scene.description || null,
        effects: scene.effects ? JSON.stringify(scene.effects) : null,
        transitionIn: scene.transitionIn || 'cut',
        transitionOut: scene.transitionOut || 'cut',
        isActive: true,
        createdAt: now,
      }).run();
    }

    // Update project status
    db.update(projects).set({ status: 'editing', updatedAt: now })
      .where(eq(projects.id, project.id)).run();

    broadcast('analysis:complete', { projectId: project.id, analysisId });

    return { message: 'Analysis saved', analysisId, scenesCreated: (body.scenes || []).length };
  });
}

async function processAnalysis(
  projectId: string,
  transcription: typeof transcriptions.$inferSelect,
  niche: string,
  templateId: string | null,
  instructions?: string,
) {
  broadcast('analysis:progress', { projectId, stage: 'Preparing transcription data...' });

  // Parse transcription data
  const segments = JSON.parse(transcription.segments);
  const wordTimestamps = JSON.parse(transcription.wordTimestamps);

  // Load template if specified
  let template = null;
  if (templateId) {
    template = db.select().from(templates).where(eq(templates.id, templateId)).get() || null;
  }

  broadcast('analysis:progress', { projectId, stage: 'Analyzing content with AI...' });

  // Call Claude
  const result = await aiProvider.analyzeForEdit(
    { segments, wordTimestamps, language: transcription.language },
    template,
    niche,
    instructions,
  );

  broadcast('analysis:progress', { projectId, stage: 'Saving analysis results...' });

  // Save analysis to DB
  const analysisId = nanoid();
  const now = new Date();

  db.insert(analyses).values({
    id: analysisId,
    projectId,
    transcriptionId: transcription.id,
    model: 'claude-sonnet-4-6',
    prompt: `niche: ${niche}, template: ${templateId || 'none'}, instructions: ${instructions || 'none'}`,
    response: JSON.stringify(result),
    scenePlan: JSON.stringify(result.scenes),
    suggestedCuts: JSON.stringify(result.suggestedCuts),
    suggestedEffects: JSON.stringify(result.suggestedEffects),
    hookAnalysis: JSON.stringify(result.hookAnalysis),
    ctaAnalysis: JSON.stringify(result.ctaAnalysis),
    contentScore: result.contentScore,
    createdAt: now,
  }).run();

  // Auto-generate scene rows
  broadcast('analysis:progress', { projectId, stage: 'Creating scene plan...' });

  // Delete old scenes for this project
  db.delete(scenes).where(eq(scenes.projectId, projectId)).run();

  for (const scene of result.scenes) {
    db.insert(scenes).values({
      id: nanoid(),
      projectId,
      analysisId,
      order: scene.order,
      startTime: scene.startTime,
      endTime: scene.endTime,
      type: scene.type,
      description: scene.description,
      effects: JSON.stringify(scene.effects),
      transitionIn: scene.transitionIn || 'cut',
      transitionOut: scene.transitionOut || 'cut',
      isActive: true,
      createdAt: now,
    }).run();
  }

  // Update project status
  db.update(projects)
    .set({
      status: 'editing',
      nicheId: niche,
      updatedAt: now,
    })
    .where(eq(projects.id, projectId))
    .run();

  broadcast('analysis:complete', { projectId, analysisId });
}
