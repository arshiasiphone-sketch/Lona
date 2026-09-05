/**
 * Phase 8.4 — QueryErrorBoundary.
 *
 * convex-react's `useQuery` rethrows server-side errors during render
 * (see node_modules/convex/dist/esm/react/client.js — `if (result
 * instanceof Error) throw result`). Without a boundary that means a
 * rejected admin query (403 from `requirePermission`, network failure,
 * deployment mismatch) surfaces as a blank/generic crash instead of a
 * recoverable state.
 *
 * This boundary catches those throws and shows a Persian card with a
 * "تلاش دوباره" action. Reset remounts the subtree, which re-subscribes
 * the query and re-fetches. It never fakes success and never hides the
 * error — it only stops the infinite-spinner failure mode.
 */
import * as React from "react";
import { Link } from "react-router";
import { getAdminErrorMessage } from "@/lib/admin-errors";

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  /** Heading shown in the fallback card. */
  title?: string;
  /** Optional route to fall back to (e.g. the product list). */
  backTo?: string;
  backLabel?: string;
}

interface QueryErrorBoundaryState {
  error: Error | null;
}

export class QueryErrorBoundary extends React.Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  state: QueryErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): QueryErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="rounded-3xl border border-edge bg-white/85 p-10 text-center">
        <p className="font-display text-2xl text-ink">
          {this.props.title ?? "بارگذاری انجام نشد"}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {getAdminErrorMessage(error)}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-full bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            تلاش دوباره
          </button>
          {this.props.backTo ? (
            <Link
              to={this.props.backTo}
              className="rounded-full hairline bg-white/70 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
            >
              {this.props.backLabel ?? "بازگشت"}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }
}