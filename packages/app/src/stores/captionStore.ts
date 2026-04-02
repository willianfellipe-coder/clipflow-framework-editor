import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CaptionStyle, CaptionAnimation, WordTimestamp } from '@clip/shared';

const MAX_HISTORY = 50;

/** Simple internal history manager for caption undo/redo (not Zustand state to avoid perf issues). */
const history: WordTimestamp[][] = [];
let historyIndex = -1;

function pushHistory(words: WordTimestamp[]) {
  history.splice(historyIndex + 1); // drop redo tail
  history.push([...words]);
  if (history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length - 1;
}

interface CaptionStore {
  captionStyle: CaptionStyle | null;
  captionAnimation: CaptionAnimation;
  words: WordTimestamp[];
  selectedWordIndex: number | null;
  presets: CaptionStyle[];
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;

  setCaptionStyle: (style: CaptionStyle | null) => void;
  setCaptionAnimation: (animation: CaptionAnimation) => void;
  setWords: (words: WordTimestamp[]) => void;
  setSelectedWordIndex: (index: number | null) => void;
  updateWord: (index: number, word: string) => void;
  updateWordTiming: (index: number, start: number, end: number) => void;
  /** GAP-011: Undo last caption edit */
  undo: () => void;
  /** GAP-011: Redo last undone caption edit */
  redo: () => void;
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
  canUndo: false,
  canRedo: false,

  setCaptionStyle: (captionStyle) => set({ captionStyle }),
  setCaptionAnimation: (captionAnimation) => set({ captionAnimation }),

  setWords: (words) => {
    // Reset history when new transcription is loaded
    history.length = 0;
    historyIndex = -1;
    pushHistory(words);
    set({ words, canUndo: false, canRedo: false });
  },

  setSelectedWordIndex: (selectedWordIndex) => set({ selectedWordIndex }),

  updateWord: (index, word) => {
    const words = [...get().words];
    if (!words[index]) return;
    words[index] = { ...words[index], word };
    pushHistory(words);
    set({ words, canUndo: historyIndex > 0, canRedo: false });
  },

  updateWordTiming: (index, start, end) => {
    const words = [...get().words];
    if (!words[index]) return;
    words[index] = { ...words[index], start, end };
    pushHistory(words);
    set({ words, canUndo: historyIndex > 0, canRedo: false });
  },

  undo: () => {
    if (historyIndex <= 0) return;
    historyIndex--;
    const words = [...history[historyIndex]];
    set({ words, canUndo: historyIndex > 0, canRedo: true });
  },

  redo: () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    const words = [...history[historyIndex]];
    set({ words, canUndo: true, canRedo: historyIndex < history.length - 1 });
  },

  fetchPresets: async () => {
    const presets = await api.get<CaptionStyle[]>('/caption-styles');
    set({ presets });
  },

  fetchCaptions: async (projectId) => {
    set({ loading: true });
    try {
      const data = await api.get<{ wordTimestamps: WordTimestamp[] }>(`/projects/${projectId}/captions`);
      const words = data.wordTimestamps || [];
      // Initialize history for this project session
      history.length = 0;
      historyIndex = -1;
      pushHistory(words);
      set({ words, loading: false, canUndo: false, canRedo: false });
    } catch {
      set({ loading: false });
    }
  },

  saveCaptions: async (projectId) => {
    const { words } = get();
    await api.patch(`/projects/${projectId}/captions`, { wordTimestamps: words });
  },
}));
