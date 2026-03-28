import { create } from 'zustand';
import { api } from '@/lib/api';
import type { RenderResult, ExportFormat, QualityPreset } from '@clip/shared';

interface ExportStore {
  renders: RenderResult[];
  currentRender: RenderResult | null;
  format: ExportFormat;
  quality: QualityPreset;
  selectedFormats: ExportFormat[];
  showExportDialog: boolean;
  fetchRenders: (projectId: string) => Promise<void>;
  setRenders: (renders: RenderResult[]) => void;
  setCurrentRender: (render: RenderResult | null) => void;
  setFormat: (format: ExportFormat) => void;
  setQuality: (quality: QualityPreset) => void;
  setSelectedFormats: (formats: ExportFormat[]) => void;
  setShowExportDialog: (show: boolean) => void;
}

export const useExportStore = create<ExportStore>((set) => ({
  renders: [],
  currentRender: null,
  format: 'reel_9x16',
  quality: 'standard',
  selectedFormats: ['reel_9x16'],
  showExportDialog: false,

  fetchRenders: async (projectId) => {
    try {
      const renders = await api.get<RenderResult[]>(`/projects/${projectId}/renders`);
      set({ renders });
    } catch {
      set({ renders: [] });
    }
  },

  setRenders: (renders) => set({ renders }),
  setCurrentRender: (currentRender) => set({ currentRender }),
  setFormat: (format) => set({ format }),
  setQuality: (quality) => set({ quality }),
  setSelectedFormats: (selectedFormats) => set({ selectedFormats }),
  setShowExportDialog: (showExportDialog) => set({ showExportDialog }),
}));
