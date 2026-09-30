type PostHogInstance = {
  capture: (event: string, props?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    posthog?: PostHogInstance;
  }
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, props);
  }
}
