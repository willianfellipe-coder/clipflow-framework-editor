import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { api } from '@/lib/api';

interface SystemStatus {
  ffmpeg: boolean;
  whisperx: boolean;
  chromium: boolean;
  database: boolean;
  ai: { mode: string; available: boolean; message: string };
}

export function Settings() {
  const { settings, fetchSettings, updateSetting, loading } = useSettingsStore();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    fetchSettings();
    api.get<SystemStatus>('/settings/system-check').then(setSystemStatus).catch(() => {});
  }, [fetchSettings]);

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await api.post('/server/restart');
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch {
      setRestarting(false);
    }
  };

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
              className="mt-1 w-full cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.whisper_model || 'base'}
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
              className="mt-1 w-full cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.default_language || 'auto'}
              onChange={(e) => updateSetting('default_language', e.target.value)}
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="pt">Portuguese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Default Export Quality</label>
            <select
              className="mt-1 w-full cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-sm"
              value={settings.default_quality || 'standard'}
              onChange={(e) => updateSetting('default_quality', e.target.value)}
            >
              <option value="draft">Draft (fast)</option>
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>

          {/* System Status */}
          {systemStatus && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">System Status</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'FFmpeg', ok: systemStatus.ffmpeg },
                  { label: 'WhisperX', ok: systemStatus.whisperx },
                  { label: 'Chromium', ok: systemStatus.chromium },
                  { label: 'Database', ok: systemStatus.database },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2">
                    {ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 text-sm">
                <div className={`h-2 w-2 rounded-full ${systemStatus.ai.available ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                <span className="text-muted-foreground">AI: {systemStatus.ai.message}</span>
              </div>
            </div>
          )}

          {/* Server Restart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Server</h3>
                <p className="text-xs text-muted-foreground">Restart the ClipFlow server to apply changes</p>
              </div>
              <button
                onClick={handleRestart}
                disabled={restarting}
                className="cursor-pointer inline-flex items-center gap-2 rounded bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${restarting ? 'animate-spin' : ''}`} />
                {restarting ? 'Restarting...' : 'Restart Server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
