import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Project } from '@clip/shared';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string) => Promise<Project>;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.get<Project[]>('/projects');
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  createProject: async (name: string) => {
    const project = await api.post<Project>('/projects', { name });
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },
}));
