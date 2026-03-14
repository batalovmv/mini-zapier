import type { ContextType, ReactNode } from 'react';
import { Component } from 'react';

import { LocaleContext } from '../../locale/LocaleProvider';
import { dictionaries } from '../../locale/messages';

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
  static contextType = LocaleContext;

  declare context: ContextType<typeof LocaleContext>;

  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '',
    };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const messages = this.context?.messages ?? dictionaries.en;

    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-rose-200 bg-rose-50/90 p-8 shadow-panel">
          <p className="muted-label text-rose-700">{messages.errorBoundary.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {messages.errorBoundary.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            {this.state.message || messages.errorBoundary.fallbackMessage}
          </p>
          <button
            className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            {messages.errorBoundary.reload}
          </button>
        </div>
      </div>
    );
  }
}

