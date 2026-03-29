import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Clip, ClipAnalysis, ClipAnalysisRequest, TargetPlatform } from '@clip/shared';

interface ClipGenStore {
  clips: Clip[];
  analyses: ClipAnalysis[];
  selectedClipId: string | null;
  loading: boolean;
  analyzing: boolean;

  fetchClips: (projectId: string) => Promise<void>;
  fetchAnalyses: (projectId: string) => Promise<void>;
  startAnalysis: (projectId: string, config: ClipAnalysisRequest) => Promise<void>;
  updateClipStatus: (clipId: string, status: string) => Promise<void>;
  updateClip: (clipId: string, updates: Record<string, unknown>) => Promise<void>;
  selectAllClips: (projectId: string) => Promise<void>;
  rejectClip: (clipId: string) => Promise<void>;
  setSelectedClipId: (id: string | null) => void;
}

export const useClipGenStore = create<ClipGenStore>((set, get) => ({
  clips: [],
  analyses: [],
  selectedClipId: null,
  loading: false,
  analyzing: false,

  fetchClips: async (projectId) => {
    set({ loading: true });
    try {
      const clips = await api.get<Clip[]>(`/clips/${projectId}`);
      set({ clips });
    } finally {
      set({ loading: false });
    }
  },

  fetchAnalyses: async (projectId) => {
    const analyses = await api.get<ClipAnalysis[]>(`/clips/analyses/${projectId}`);
    set({ analyses });
  },

  startAnalysis: async (projectId, config) => {
    set({ analyzing: true });
    try {
      await api.post(`/clips/analyze/${projectId}`, config);
    } catch {
      set({ analyzing: false });
      throw new Error('Failed to start analysis');
    }
  },

  updateClipStatus: async (clipId, status) => {
    await api.patch(`/clips/${clipId}/status`, { status });
    set((state) => ({
      clips: state.clips.map((c) => c.id === clipId ? { ...c, status: status as Clip['status'] } : c),
    }));
  },

  updateClip: async (clipId, updates) => {
    const updated = await api.patch<Clip>(`/clips/${clipId}`, updates);
    set((state) => ({
      clips: state.clips.map((c) => c.id === clipId ? { ...c, ...updated } : c),
    }));
  },

  selectAllClips: async (projectId) => {
    const { clips } = get();
    const suggested = clips.filter((c) => c.status === 'suggested');
    const ids = suggested.map((c) => c.id);
    if (ids.length > 0) {
      await api.patch(`/clips/${projectId}/bulk`, { clipIds: ids, updates: { status: 'selected' } });
      set((state) => ({
        clips: state.clips.map((c) => ids.includes(c.id) ? { ...c, status: 'selected' } : c),
      }));
    }
  },

  rejectClip: async (clipId) => {
    await api.delete(`/clips/${clipId}`);
    set((state) => ({
      clips: state.clips.map((c) => c.id === clipId ? { ...c, status: 'rejected' } : c),
    }));
  },

  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
}));
