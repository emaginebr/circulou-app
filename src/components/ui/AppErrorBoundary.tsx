import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  override render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div
        className="mx-auto max-w-2xl px-4 py-12 text-center"
        role="alert"
      >
        <h2 className="text-xl font-semibold mb-2">Algo deu errado.</h2>
        <p className="text-[var(--color-mute)] mb-4">
          {this.state.error?.message ?? ''}
        </p>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--color-primary-hover)] transition"
          onClick={this.reset}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
