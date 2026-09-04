// Runtime in-memory state tracking whether a cinematic page transition loader is active
let isTransitionLoading = false;
const listeners = new Set<(loading: boolean) => void>();

export function getIsPageTransitionLoading(): boolean {
  return isTransitionLoading;
}

export function setPageTransitionLoading(val: boolean): void {
  isTransitionLoading = val;
  listeners.forEach((fn) => {
    try {
      fn(val);
    } catch (e) {
      console.warn('Page transition subscriber error:', e);
    }
  });
}

export function subscribeToPageTransition(fn: (loading: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
