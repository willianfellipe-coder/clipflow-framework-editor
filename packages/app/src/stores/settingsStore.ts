import { create } from 'zustand';
import { api } from '@/lib/api';

interface SettingsStore {
  settings: Record<string, string>;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await api.get<Record<string, string>>('/settings');
      set({ settings });
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: async (key: string, value: string) => {
    await api.patch('/settings', { [key]: value });
    set({ settings: { ...get().settings, [key]: value } });
  },
}));
