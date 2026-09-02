// In-memory runtime state for single-page app session
// Resets on full page reload / fresh visit, but persists across SPA route navigation (Events, Team, Sponsors, Calendar)

let hasSeenIntro = false;

export function getHasSeenIntro(): boolean {
  return hasSeenIntro;
}

export function setHasSeenIntro(val: boolean = true): void {
  hasSeenIntro = val;
}
