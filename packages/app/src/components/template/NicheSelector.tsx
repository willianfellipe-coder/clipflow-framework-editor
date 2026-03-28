import { cn } from '@/lib/utils';
import {
  Dumbbell, Monitor, ChefHat, BookOpen, ShoppingBag, Mic, LayoutGrid,
} from 'lucide-react';

const niches = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'tech', label: 'Tech', icon: Monitor },
  { id: 'food', label: 'Food', icon: ChefHat },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
  { id: 'podcast', label: 'Podcast', icon: Mic },
];

interface NicheSelectorProps {
  selected: string;
  onChange: (niche: string) => void;
}

export function NicheSelector({ selected, onChange }: NicheSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {niches.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            selected === id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
