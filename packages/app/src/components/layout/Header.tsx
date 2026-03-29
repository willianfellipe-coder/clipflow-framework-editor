import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h1 className="text-lg font-semibold">{pageName}</h1>
      <div className="flex items-center gap-3">
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
