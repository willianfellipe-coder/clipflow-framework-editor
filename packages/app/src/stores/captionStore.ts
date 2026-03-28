import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CaptionStyle, CaptionAnimation, WordTimestamp } from '@clip/shared';

interface CaptionStore {
  captionStyle: CaptionStyle | null;
  captionAnimation: CaptionAnimation;
  words: WordTimestamp[];
  selectedWordIndex: number | null;
  presets: CaptionStyle[];
  loading: boolean;

  setCaptionStyle: (style: CaptionStyle | null) => void;
  setCaptionAnimation: (animation: CaptionAnimation) => void;
  setWords: (words: WordTimestamp[]) => void;
  setSelectedWordIndex: (index: number | null) => void;
  updateWord: (index: number, word: string) => void;
  updateWordTiming: (index: number, start: number, end: number) => void;
  fetchPresets: () => Promise<void>;
  fetchCaptions: (projectId: string) => Promise<void>;
  saveCaptions: (projectId: string) => Promise<void>;
}

export const useCaptionStore = create<CaptionStore>((set, get) => ({
  captionStyle: null,
  captionAnimation: 'word-highlight',
  words: [],
  selectedWordIndex: null,
  presets: [],
  loading: false,

  setCaptionStyle: (captionStyle) => set({ captionStyle }),
  setCaptionAnimation: (captionAnimation) => set({ captionAnimation }),
  setWords: (words) => set({ words }),
  setSelectedWordIndex: (selectedWordIndex) => set({ selectedWordIndex }),

  updateWord: (index, word) => {
    const words = [...get().words];
    if (words[index]) {
      words[index] = { ...words[index], word };
      set({ words });
    }
  },

  updateWordTiming: (index, start, end) => {
    const words = [...get().words];
    if (words[index]) {
      words[index] = { ...words[index], start, end };
      set({ words });
    }
  },

  fetchPresets: async () => {
    const presets = await api.get<CaptionStyle[]>('/caption-styles');
    set({ presets });
  },

  fetchCaptions: async (projectId) => {
    set({ loading: true });
    try {
      const data = await api.get<{ wordTimestamps: WordTimestamp[] }>(`/projects/${projectId}/captions`);
      set({ words: data.wordTimestamps || [] });
    } catch {
      // No transcription yet
    } finally {
      set({ loading: false });
    }
  },

  saveCaptions: async (projectId) => {
    const { words } = get();
    await api.patch(`/projects/${projectId}/captions`, { wordTimestamps: words });
  },
}));
