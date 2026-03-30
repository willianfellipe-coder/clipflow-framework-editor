import { Loader2, Brain, Terminal } from 'lucide-react';

interface AnalysisProgressProps {
  stage: string;
  isMcpPending?: boolean;
  projectName?: string;
  onCancel?: () => void;
}

export function AnalysisProgress({ stage, isMcpPending, projectName, onCancel }: AnalysisProgressProps) {
  if (isMcpPending) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-blue-800/40 bg-blue-950/30 p-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 shrink-0 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300">Aguardando Claude Code</span>
        </div>
        <p className="text-[11px] leading-relaxed text-blue-200/80">
          No Claude Code, peça para analisar:
        </p>
        <code className="rounded bg-black/40 px-2 py-1.5 text-[10px] leading-relaxed text-blue-300 break-all">
          analise o projeto {projectName || 'atual'} com clipflow_analyze_edit
        </code>
        <p className="text-[10px] text-blue-200/60">
          A análise aparecerá aqui automaticamente após o Claude Code executar.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-1 w-full rounded border border-blue-800/40 px-2 py-1 text-[11px] text-blue-400 hover:bg-blue-900/30"
          >
            Cancelar
          </button>
        )}
      </div>
    );
  }

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
