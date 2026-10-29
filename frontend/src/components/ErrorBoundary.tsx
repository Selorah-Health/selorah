import React from 'react';
import ErrorFallback from './ErrorFallback';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorId: string;
};

function newErrorId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SEL-${stamp}${random}`;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: newErrorId() };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep a local trace so the reference can be matched to a real failure.
    try {
      console.error('[Selorah] Render error', this.state.errorId, error, info.componentStack);
    } catch {
      // Logging must never throw.
    }
  }

  private retry = () => {
    this.setState({ hasError: false, error: null, errorId: newErrorId() });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback error={this.state.error} errorId={this.state.errorId} onRetry={this.retry} />
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
