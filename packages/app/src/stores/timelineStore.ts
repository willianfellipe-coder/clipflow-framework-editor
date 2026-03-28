import { create } from 'zustand';
import type { Scene } from '@clip/shared';

interface TimelineStore {
  scenes: Scene[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  setScenes: (scenes: Scene[]) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaying: (playing: boolean) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  scenes: [],
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  setScenes: (scenes) => set({ scenes }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaying: (isPlaying) => set({ isPlaying }),
}));
