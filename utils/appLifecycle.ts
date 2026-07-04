import { AppState, AppStateStatus } from 'react-native';

/** True after the first boot sequence completes in this JS session. */
let bootCompleted = false;

/** True when the app was backgrounded since last foreground (warm resume). */
let wasBackgrounded = false;

let appStateSubscription: { remove: () => void } | null = null;

export type ResumeListener = () => void;
const resumeListeners = new Set<ResumeListener>();

export function isColdStart(): boolean {
  return !bootCompleted;
}

export function markBootCompleted(): void {
  bootCompleted = true;
}

export function onWarmResume(listener: ResumeListener): () => void {
  resumeListeners.add(listener);
  return () => resumeListeners.delete(listener);
}

function notifyWarmResume() {
  resumeListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  });
}

export function initAppLifecycle(): () => void {
  if (appStateSubscription) {
    return () => appStateSubscription?.remove();
  }

  appStateSubscription = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next === 'background' || next === 'inactive') {
      wasBackgrounded = true;
      return;
    }

    if (next === 'active' && wasBackgrounded && bootCompleted) {
      wasBackgrounded = false;
      notifyWarmResume();
    }
  });

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}
