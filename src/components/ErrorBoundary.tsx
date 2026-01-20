
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Uncaught error: ${error.message}`);
    logger.error(`Error Info: ${JSON.stringify(errorInfo, null, 2)}`);
  }

  handleResetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono overflow-auto max-h-32">
                  {this.state.error.message}
                </p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="default">
                  Refresh Page
                </Button>
                <Button onClick={this.handleResetError} variant="outline">
                  Try Again
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (this.state.error) {
                      navigator.clipboard.writeText(
                        `Error: ${this.state.error.message}\n\nStack: ${this.state.error.stack}`
                      );
                    }
                  }}
                >
                  Copy Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
