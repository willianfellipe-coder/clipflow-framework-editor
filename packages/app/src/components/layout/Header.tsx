import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const pageKeys: Record<string, string> = {
  '/': 'nav.dashboard',
  '/editor': 'nav.editor',
  '/clipgen': 'nav.clipgen',
  '/templates': 'nav.templates',
  '/batch': 'nav.batch',
  '/history': 'nav.history',
  '/settings': 'nav.settings',
};

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const pageName = t(pageKeys[basePath] || 'app.name');

  const [aiMode, setAiMode] = useState<{ mode: string; available: boolean; message: string } | null>(null);

  useEffect(() => {
    api.get<{ mode: string; available: boolean; message: string }>('/settings/ai-status')
      .then(setAiMode)
      .catch(() => {});
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h1 className="text-lg font-semibold">{pageName}</h1>
      <div className="flex items-center gap-4">
        {/* AI mode indicator */}
        {aiMode && (
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            aiMode.available
              ? aiMode.mode === 'claude-code' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
              : 'bg-zinc-500/15 text-zinc-400',
          )}>
            <Brain className="h-3 w-3" />
            {aiMode.mode === 'claude-code' ? 'Claude Code' :
             aiMode.mode === 'claude-api' ? 'Claude API' : 'No AI'}
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-emerald-500' : 'bg-red-500',
            )}
          />
          {isConnected ? t('connection.connected') : t('connection.disconnected')}
        </div>
      </div>
    </header>
  );
}
