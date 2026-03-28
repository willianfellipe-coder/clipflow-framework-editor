import { Loader2, Brain } from 'lucide-react';

interface AnalysisProgressProps {
  stage: string;
}

export function AnalysisProgress({ stage }: AnalysisProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-8">
      <div className="relative">
        <Brain className="h-10 w-10 text-primary" />
        <Loader2 className="absolute -right-1 -top-1 h-4 w-4 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-primary">Analyzing with AI</h3>
        <p className="mt-1 text-sm text-muted-foreground">{stage}</p>
      </div>
    </div>
  );
}
