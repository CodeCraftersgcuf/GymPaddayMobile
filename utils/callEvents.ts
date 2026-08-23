type CallEndedPayload = { callId?: string };

type Listener = (payload: CallEndedPayload) => void;

const listeners = new Set<Listener>();

export function emitCallEnded(payload: CallEndedPayload = {}): void {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      /* ignore */
    }
  });
}

export function onCallEnded(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
