import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface InnerProps {
  children: React.ReactNode;
  pathname: string;
  onGoHome: () => void;
}

class Inner extends React.Component<InnerProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prev: InnerProps) {
    if (prev.pathname !== this.props.pathname && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  reload = () => {
    // Chunk-load failures cache in module graph; full reload is the safe retry.
    if (this.state.error && /chunk|dynamically imported|Failed to fetch/i.test(this.state.error.message)) {
      window.location.reload();
      return;
    }
    this.reset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message ?? "Unknown error";
    const isChunk = /chunk|dynamically imported module|Failed to fetch/i.test(msg);

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isChunk ? "Couldn't load this page" : "Something went wrong"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {isChunk
            ? "We couldn't fetch the resources for this page. Check your connection and try again."
            : "An unexpected error occurred while loading this page."}
        </p>
        <pre className="text-xs text-destructive/70 bg-destructive/5 rounded-xl px-4 py-3 max-w-lg overflow-auto mb-6 text-left">
          {msg}
        </pre>
        <div className="flex gap-3">
          <Button onClick={this.reload} className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button variant="outline" onClick={this.props.onGoHome} className="gap-2 rounded-xl">
            <Home className="h-4 w-4" /> Go Home
          </Button>
        </div>
      </div>
    );
  }
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <Inner pathname={pathname} onGoHome={() => navigate("/")}>
      {children}
    </Inner>
  );
}
