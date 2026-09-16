import { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">Co-Work hit an unexpected UI error.</div>;
    }
    return this.props.children;
  }
}
