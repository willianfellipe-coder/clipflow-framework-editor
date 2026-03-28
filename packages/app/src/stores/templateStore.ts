import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Template, Project } from '@clip/shared';

interface TemplateStore {
  templates: Template[];
  selectedTemplate: Template | null;
  nicheFilter: string;
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  setSelectedTemplate: (template: Template | null) => void;
  setNicheFilter: (niche: string) => void;
  filteredTemplates: () => Template[];
  createTemplate: (data: Record<string, unknown>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  applyTemplate: (projectId: string, templateId: string) => Promise<Project>;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  nicheFilter: 'all',
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
  setNicheFilter: (nicheFilter) => set({ nicheFilter }),

  filteredTemplates: () => {
    const { templates, nicheFilter } = get();
    if (nicheFilter === 'all') return templates;
    return templates.filter((t) => t.niche === nicheFilter);
  },

  createTemplate: async (data) => {
    const template = await api.post<Template>('/templates', data);
    set((state) => ({ templates: [...state.templates, template] }));
    return template;
  },

  deleteTemplate: async (id) => {
    await api.delete(`/templates/${id}`);
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },

  applyTemplate: async (projectId, templateId) => {
    return api.post<Project>(`/projects/${projectId}/apply-template`, { templateId });
  },
}));
