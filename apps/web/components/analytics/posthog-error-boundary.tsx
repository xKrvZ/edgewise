'use client';

import { captureAnalyticsException } from '@/lib/posthog';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface PostHogErrorBoundaryProps {
  children: ReactNode;
}

interface PostHogErrorBoundaryState {
  error: Error | null;
}

/** Captures React render errors to PostHog, then rethrows for upstream error UI. */
export class PostHogErrorBoundary extends Component<
  PostHogErrorBoundaryProps,
  PostHogErrorBoundaryState
> {
  state: PostHogErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PostHogErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureAnalyticsException(error, {
      component_stack: info.componentStack,
      source: 'react_error_boundary',
    });
  }

  render() {
    if (this.state.error) {
      throw this.state.error;
    }

    return this.props.children;
  }
}
