import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function Settings() {
  const { settings, fetchSettings, updateSetting, loading } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-muted-foreground">Configure ClipFlow preferences</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      ) : (
        <div className="max-w-xl space-y-6">
          <div>
            <label className="block text-sm font-medium">Default WhisperX Model</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.whisper_model || 'large-v3'}
              onChange={(e) => updateSetting('whisper_model', e.target.value)}
            >
              <option value="tiny">tiny (fastest)</option>
              <option value="base">base</option>
              <option value="small">small</option>
              <option value="medium">medium</option>
              <option value="large-v3">large-v3 (best quality)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Default Language</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.default_language || 'auto'}
              onChange={(e) => updateSetting('default_language', e.target.value)}
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="pt">Portuguese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Default Export Quality</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.default_quality || 'standard'}
              onChange={(e) => updateSetting('default_quality', e.target.value)}
            >
              <option value="draft">Draft (fast)</option>
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
