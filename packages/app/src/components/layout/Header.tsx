import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/editor': 'Editor',
  '/templates': 'Templates',
  '/batch': 'Batch Processing',
  '/history': 'History',
  '/settings': 'Settings',
};

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const pageName = pageNames[basePath] || 'ClipFlow';

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
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </header>
  );
}
