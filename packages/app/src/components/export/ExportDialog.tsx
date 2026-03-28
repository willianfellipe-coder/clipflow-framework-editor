import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { FormatSelector } from './FormatSelector';
import { QualitySettings } from './QualitySettings';
import { RenderProgress } from './RenderProgress';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ExportFormat, QualityPreset } from '@clip/shared';

interface ExportDialogProps {
  projectId: string;
  onClose: () => void;
}

interface RenderInfo {
  renderId: string;
  format: string;
  percent: number;
  status: 'queued' | 'rendering' | 'done' | 'error';
  errorMessage?: string;
}

export function ExportDialog({ projectId, onClose }: ExportDialogProps) {
  const { subscribe } = useWebSocket();
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['reel_9x16']);
  const [quality, setQuality] = useState<QualityPreset>('standard');
  const [isRendering, setIsRendering] = useState(false);
  const [activeRenders, setActiveRenders] = useState<RenderInfo[]>([]);

  // Listen for render events
  useEffect(() => {
    const unsub1 = subscribe('render:progress', (data: unknown) => {
      const { renderId, percent } = data as { renderId: string; percent: number };
      setActiveRenders((prev) =>
        prev.map((r) => r.renderId === renderId ? { ...r, percent, status: 'rendering' } : r),
      );
    });

    const unsub2 = subscribe('render:complete', (data: unknown) => {
      const { renderId } = data as { renderId: string };
      setActiveRenders((prev) =>
        prev.map((r) => r.renderId === renderId ? { ...r, percent: 100, status: 'done' } : r),
      );
    });

    const unsub3 = subscribe('render:error', (data: unknown) => {
      const { renderId, error } = data as { renderId: string; error: string };
      setActiveRenders((prev) =>
        prev.map((r) => r.renderId === renderId ? { ...r, status: 'error', errorMessage: error } : r),
      );
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [subscribe]);

  const handleStartRender = useCallback(async () => {
    if (selectedFormats.length === 0) return;
    setIsRendering(true);

    try {
      if (selectedFormats.length === 1) {
        const res = await api.post<{ renderId: string }>(`/projects/${projectId}/render`, {
          format: selectedFormats[0],
          quality,
        });
        setActiveRenders([{ renderId: res.renderId, format: selectedFormats[0], percent: 0, status: 'queued' }]);
      } else {
        const res = await api.post<{ renderIds: string[] }>(`/projects/${projectId}/render/multi`, {
          formats: selectedFormats,
          quality,
        });
        setActiveRenders(
          res.renderIds.map((id, i) => ({
            renderId: id,
            format: selectedFormats[i],
            percent: 0,
            status: 'queued' as const,
          })),
        );
      }
    } catch (err) {
      setIsRendering(false);
      alert(err instanceof Error ? err.message : 'Failed to start render');
    }
  }, [projectId, selectedFormats, quality]);

  const handleCancel = useCallback(async (renderId: string) => {
    try {
      await api.post(`/renders/${renderId}/cancel`);
      setActiveRenders((prev) =>
        prev.map((r) => r.renderId === renderId ? { ...r, status: 'error', errorMessage: 'Cancelled' } : r),
      );
    } catch {}
  }, []);

  const handleDownload = useCallback((renderId: string) => {
    window.open(`/api/renders/${renderId}/download`, '_blank');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-lg font-semibold">Export Video</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {!isRendering ? (
            <>
              <FormatSelector selected={selectedFormats} onChange={setSelectedFormats} />
              <QualitySettings selected={quality} onChange={setQuality} />

              <button
                onClick={handleStartRender}
                disabled={selectedFormats.length === 0}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Export {selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''}
              </button>
            </>
          ) : (
            <RenderProgress
              renders={activeRenders}
              onCancel={handleCancel}
              onDownload={handleDownload}
              onClose={() => { setIsRendering(false); setActiveRenders([]); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
