import { create } from 'zustand';
import type { CaptionStyle, WordTimestamp } from '@clip/shared';

interface CaptionStore {
  captionStyle: CaptionStyle | null;
  words: WordTimestamp[];
  setCaptionStyle: (style: CaptionStyle | null) => void;
  setWords: (words: WordTimestamp[]) => void;
}

export const useCaptionStore = create<CaptionStore>((set) => ({
  captionStyle: null,
  words: [],
  setCaptionStyle: (captionStyle) => set({ captionStyle }),
  setWords: (words) => set({ words }),
}));
