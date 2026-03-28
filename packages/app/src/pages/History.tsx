import { useEffect, useState } from 'react';
import { Clock, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { Project, RenderResult } from '@clip/shared';

interface RenderWithProject extends RenderResult {
  projectName?: string;
}

export function History() {
  const { t } = useTranslation();
  const [renders, setRenders] = useState<RenderWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const projects = await api.get<Project[]>('/projects');
        const allRenders: RenderWithProject[] = [];

        for (const project of projects) {
          try {
            const projectRenders = await api.get<RenderResult[]>(`/projects/${project.id}/renders`);
            for (const r of projectRenders) {
              allRenders.push({ ...r, projectName: project.name });
            }
          } catch {}
        }

        allRenders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRenders(allRenders);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('history.title')}</h2>
        <p className="mt-1 text-muted-foreground">{t('history.subtitle')}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : renders.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('history.noExports')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('history.noExportsHint')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {renders.map((r) => (
            <div key={r.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              {statusIcon(r.status)}
              <div className="flex-1">
                <p className="text-sm font-medium">{r.projectName || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  {r.format.replace(/_/g, ' ')} &middot; {r.width}x{r.height} &middot; {r.quality}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
                {r.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {(r.fileSize / 1024 / 1024).toFixed(1)}MB
                  </p>
                )}
              </div>
              {r.status === 'done' && (
                <a
                  href={`/api/renders/${r.id}/download`}
                  className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-3 w-3" />
                  {t('export.download')}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
