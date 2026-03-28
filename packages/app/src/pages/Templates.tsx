import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTemplateStore } from '@/stores/templateStore';
import { NicheSelector } from '@/components/template/NicheSelector';
import { TemplateCard } from '@/components/template/TemplateCard';
import { TemplatePreview } from '@/components/template/TemplatePreview';
import { TemplateCreateForm } from '@/components/template/TemplateCreateForm';
import type { Template } from '@clip/shared';

export function Templates() {
  const {
    fetchTemplates, filteredTemplates, nicheFilter, setNicheFilter,
    createTemplate, deleteTemplate, loading,
  } = useTemplateStore();

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const templates = filteredTemplates();

  const handleCreate = async (data: Record<string, unknown>) => {
    await createTemplate(data);
    setShowCreateForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="mt-1 text-muted-foreground">
            Pre-configured editing styles for different content niches
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Custom
        </button>
      </div>

      {/* Niche filter */}
      <NicheSelector selected={nicheFilter} onChange={setNicheFilter} />

      {/* Template grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No templates found{nicheFilter !== 'all' ? ` for "${nicheFilter}"` : ''}.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onDelete={() => handleDelete(previewTemplate.id)}
        />
      )}

      {/* Create form modal */}
      {showCreateForm && (
        <TemplateCreateForm
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
