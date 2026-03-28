import { create } from 'zustand';
import type { RenderResult, ExportFormat } from '@clip/shared';

interface ExportStore {
  renders: RenderResult[];
  currentRender: RenderResult | null;
  format: ExportFormat;
  setRenders: (renders: RenderResult[]) => void;
  setCurrentRender: (render: RenderResult | null) => void;
  setFormat: (format: ExportFormat) => void;
}

export const useExportStore = create<ExportStore>((set) => ({
  renders: [],
  currentRender: null,
  format: 'reel_9x16',
  setRenders: (renders) => set({ renders }),
  setCurrentRender: (currentRender) => set({ currentRender }),
  setFormat: (format) => set({ format }),
}));
