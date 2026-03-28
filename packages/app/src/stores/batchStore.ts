import { create } from 'zustand';
import type { BatchJob } from '@clip/shared';

interface BatchStore {
  jobs: BatchJob[];
  loading: boolean;
  setJobs: (jobs: BatchJob[]) => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  jobs: [],
  loading: false,
  setJobs: (jobs) => set({ jobs }),
}));
