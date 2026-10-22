import React from 'react';

interface ViewerErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
  onError: (error: Error) => void;
}

interface ViewerErrorBoundaryState {
  error: Error | null;
}

export class ViewerErrorBoundary extends React.Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ViewerErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  componentDidUpdate(previousProps: ViewerErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export default ViewerErrorBoundary;
