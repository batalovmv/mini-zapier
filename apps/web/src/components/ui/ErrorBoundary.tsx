import type { ReactNode } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unexpected frontend error.',
    };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-rose-200 bg-rose-50/90 p-8 shadow-panel">
          <p className="muted-label text-rose-700">Error boundary</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            The UI hit an unexpected rendering error.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            {this.state.message}
          </p>
          <button
            className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
