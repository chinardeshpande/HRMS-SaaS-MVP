import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private goToSafeRoute = () => {
    const hasSession = Boolean(localStorage.getItem('tokens'));
    window.location.assign(hasSession ? '/dashboard' : '/login');
  };

  public render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      const title = this.props.title || 'This page could not be loaded';
      const message =
        this.props.message ||
        'The application hit an unexpected issue while opening this view. Your session is still safe.';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-xl w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
              </div>
            </div>

            {isDevelopment && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                <p className="text-sm font-medium text-red-800 mb-2">Developer details</p>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
                {this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-64">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary flex-1"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={this.goToSafeRoute}
                className="btn-secondary flex-1"
              >
                Go to safe page
              </button>
            </div>

            {!isDevelopment && (
              <p className="mt-4 text-xs text-gray-500">
                Error reference: {this.state.error?.name || 'ApplicationError'}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
