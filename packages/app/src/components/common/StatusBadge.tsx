import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  transcribing: 'bg-blue-900 text-blue-300',
  analyzing: 'bg-purple-900 text-purple-300',
  editing: 'bg-yellow-900 text-yellow-300',
  rendering: 'bg-orange-900 text-orange-300',
  done: 'bg-emerald-900 text-emerald-300',
  error: 'bg-red-900 text-red-300',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize',
        statusStyles[status] || statusStyles.draft,
      )}
    >
      {status}
    </span>
  );
}
