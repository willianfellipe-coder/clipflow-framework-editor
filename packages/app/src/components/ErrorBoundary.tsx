import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error card to help identify which section crashed */
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GAP-003: React Error Boundary — catches render errors in the subtree and
 * shows a recovery UI instead of a white blank screen.
 *
 * Usage:
 *   <ErrorBoundary fallbackLabel="Editor">
 *     <Editor />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console (or a future error reporting service)
    console.error(`[ErrorBoundary] ${this.props.fallbackLabel ?? 'App'} crashed:`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallbackLabel = 'This section' } = this.props;
    const message = this.state.error?.message ?? 'Unknown error';

    return (
      <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {fallbackLabel} encountered an unexpected error
          </p>
          <p className="max-w-sm text-xs text-muted-foreground break-all">{message}</p>
        </div>
        <button
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }
}
