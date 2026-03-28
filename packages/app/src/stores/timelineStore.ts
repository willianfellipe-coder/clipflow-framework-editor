import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Scene } from '@clip/shared';

interface TimelineStore {
  scenes: Scene[];
  selectedSceneId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loading: boolean;
  fetchScenes: (projectId: string) => Promise<void>;
  setScenes: (scenes: Scene[]) => void;
  setSelectedScene: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaying: (playing: boolean) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  scenes: [],
  selectedSceneId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  loading: false,

  fetchScenes: async (projectId: string) => {
    set({ loading: true });
    try {
      const scenes = await api.get<Scene[]>(`/projects/${projectId}/scenes`);
      set({ scenes });
    } finally {
      set({ loading: false });
    }
  },

  setScenes: (scenes) => set({ scenes }),
  setSelectedScene: (selectedSceneId) => set({ selectedSceneId }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaying: (isPlaying) => set({ isPlaying }),
}));
