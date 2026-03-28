import { create } from 'zustand';
import { api } from '@/lib/api';
import type { BatchJob } from '@clip/shared';

interface BatchStore {
  jobs: BatchJob[];
  loading: boolean;
  fetchJobs: () => Promise<void>;
  createBatch: (data: { name: string; videoPaths: string[]; templateId?: string; formats?: string[] }) => Promise<BatchJob>;
  startBatch: (id: string) => Promise<void>;
  pauseBatch: (id: string) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
}

export const useBatchStore = create<BatchStore>((set, get) => ({
  jobs: [],
  loading: false,

  fetchJobs: async () => {
    set({ loading: true });
    try {
      const jobs = await api.get<BatchJob[]>('/batch');
      set({ jobs });
    } finally {
      set({ loading: false });
    }
  },

  createBatch: async (data) => {
    const job = await api.post<BatchJob>('/batch', data);
    set((state) => ({ jobs: [...state.jobs, job] }));
    return job;
  },

  startBatch: async (id) => {
    await api.post(`/batch/${id}/start`);
    get().fetchJobs();
  },

  pauseBatch: async (id) => {
    await api.post(`/batch/${id}/pause`);
    get().fetchJobs();
  },

  deleteBatch: async (id) => {
    await api.delete(`/batch/${id}`);
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
  },
}));
