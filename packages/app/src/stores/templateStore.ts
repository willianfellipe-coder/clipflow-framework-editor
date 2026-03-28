import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Template } from '@clip/shared';

interface TemplateStore {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  setSelectedTemplate: (template: Template | null) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,

  fetchTemplates: async () => {
    set({ loading: true });
    try {
      const templates = await api.get<Template[]>('/templates');
      set({ templates });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
}));
