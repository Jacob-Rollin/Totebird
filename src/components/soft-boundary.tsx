"use client";

import { Component, type ReactNode } from "react";

/**
 * Catch client-side Clerk/render explosions so marketing CTAs still show
 * guest links instead of bubbling into app/error.tsx.
 */
export class SoftBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[totebird] SoftBoundary caught", error.message);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
