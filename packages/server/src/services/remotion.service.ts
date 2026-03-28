import path from 'path';
import os from 'os';
import { statSync } from 'fs';
import { PATHS } from '../config.js';
import { FORMAT_CONFIGS } from '@clip/shared';
import type { ExportFormat, QualityPreset } from '@clip/shared';

interface RenderProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
}

interface RenderResult {
  outputPath: string;
  fileSize: number;
  width: number;
  height: number;
  duration: number;
}

interface CompositionProps {
  videoSrc: string;
  scenes: unknown[];
  captions: unknown[];
  captionStyle: unknown;
  captionAnimation?: string;
  showProgressBar?: boolean;
  [key: string]: unknown;
}

export class RemotionService {
  private bundled: string | null = null;

  /**
   * Bundle Remotion project (cached after first run).
   */
  async ensureBundle(): Promise<string> {
    if (this.bundled) return this.bundled;

    const { bundle } = await import('@remotion/bundler');
    const entryPoint = path.join(PATHS.root, 'packages/remotion/src/index.ts');

    this.bundled = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    return this.bundled;
  }

  /**
   * Render a video for a specific format.
   */
  async render(
    projectId: string,
    format: ExportFormat,
    props: CompositionProps,
    quality: QualityPreset,
    onProgress: (progress: RenderProgress) => void,
  ): Promise<RenderResult> {
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const bundleLocation = await this.ensureBundle();
    const formatConfig = FORMAT_CONFIGS[format];

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: formatConfig.compositionId,
      inputProps: { ...props, ...formatConfig.propOverrides },
    });

    const outputPath = path.join(
      PATHS.renders,
      `${projectId}_${format}_${Date.now()}.mp4`,
    );

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { ...props, ...formatConfig.propOverrides },
      onProgress: ({ progress }) => {
        onProgress({
          percent: Math.round(progress * 100),
          currentFrame: Math.round(progress * composition.durationInFrames),
          totalFrames: composition.durationInFrames,
        });
      },
      concurrency: Math.max(1, os.cpus().length - 1),
    });

    const stats = statSync(outputPath);
    return {
      outputPath,
      fileSize: stats.size,
      width: formatConfig.width,
      height: formatConfig.height,
      duration: composition.durationInFrames / composition.fps,
    };
  }

  /**
   * Render multiple formats sequentially.
   */
  async renderMulti(
    projectId: string,
    formats: ExportFormat[],
    props: CompositionProps,
    quality: QualityPreset,
    onProgress: (format: ExportFormat, progress: RenderProgress) => void,
  ): Promise<Map<ExportFormat, RenderResult>> {
    const results = new Map<ExportFormat, RenderResult>();

    for (const format of formats) {
      const result = await this.render(
        projectId,
        format,
        props,
        quality,
        (p) => onProgress(format, p),
      );
      results.set(format, result);
    }

    return results;
  }
}

export const remotionService = new RemotionService();
