import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Film,
  Sparkles,
  Palette,
  Layers,
  Clock,
  Settings,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const linkKeys = [
  { to: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/editor', icon: Film, key: 'nav.editor' },
  { to: '/clipgen', icon: Sparkles, key: 'nav.clipgen' },
  { to: '/templates', icon: Palette, key: 'nav.templates' },
  { to: '/batch', icon: Layers, key: 'nav.batch' },
  { to: '/history', icon: Clock, key: 'nav.history' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === 'pt-BR' ? 'en' : 'pt-BR';
    i18n.changeLanguage(next);
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Film className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">{t('app.name')}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {linkKeys.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={t(key)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary glow-primary'
                  : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground hover:translate-x-0.5',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={toggleLanguage}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          {i18n.language === 'pt-BR' ? 'English' : 'Português'}
        </button>
        <p className="px-3 text-xs text-muted-foreground">{t('app.name')} {t('app.version')}</p>
      </div>
    </aside>
  );
}
