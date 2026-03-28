import { useEffect } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import { NICHES } from '@clip/shared';

const nicheIcons: Record<string, string> = {
  fitness: 'Dumbbell',
  tech: 'Monitor',
  food: 'ChefHat',
  education: 'BookOpen',
  ecommerce: 'ShoppingBag',
  podcast: 'Mic',
};

export function Templates() {
  const { templates, fetchTemplates, loading } = useTemplateStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="mt-1 text-muted-foreground">
            Pre-configured editing styles for different content niches
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const niche = NICHES[template.niche as keyof typeof NICHES];
            const colors = niche?.colorPalette || ['#6366F1'];
            return (
              <div
                key={template.id}
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div
                  className="mb-3 flex h-24 items-center justify-center rounded"
                  style={{ backgroundColor: colors[0] + '20' }}
                >
                  <span className="text-3xl font-bold" style={{ color: colors[0] }}>
                    {template.niche.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {template.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {template.niche}
                  </span>
                  {template.isBuiltIn && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Built-in
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
