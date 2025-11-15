import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log error to console — you could integrate remote logging here
    // eslint-disable-next-line no-console
    console.error('Uncaught error in React tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-2xl font-semibold text-red-600">Something went wrong</h1>
            <p className="mt-4 text-sm text-gray-600">An unexpected error occurred while rendering the app.</p>
            <pre className="mt-4 p-3 bg-gray-100 rounded text-left overflow-auto text-xs text-red-700">{String(this.state.error)}</pre>
            <div className="mt-4">
              <button
                className="px-4 py-2 bg-slate-900 text-white rounded"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
