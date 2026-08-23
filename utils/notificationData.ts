/** Flatten Expo / FCM notification payloads into a single data object. */
export function extractNotificationData(notification: any): Record<string, unknown> {
  const content = notification?.request?.content ?? notification?.content ?? {};
  const trigger = notification?.request?.trigger ?? {};
  const raw = {
    ...(typeof trigger?.remoteMessage?.data === 'object' ? trigger.remoteMessage.data : {}),
    ...(typeof content?.data === 'object' ? content.data : {}),
    ...(typeof notification?.data === 'object' ? notification.data : {}),
  } as Record<string, unknown>;

  const nested = raw.data;
  if (typeof nested === 'string') {
    try {
      const parsed = JSON.parse(nested);
      if (parsed && typeof parsed === 'object') {
        Object.assign(raw, parsed);
      }
    } catch {
      /* ignore */
    }
  } else if (nested && typeof nested === 'object') {
    Object.assign(raw, nested as Record<string, unknown>);
  }

  const type = raw.type ?? raw.event ?? content?.categoryIdentifier;
  if (type != null && raw.type == null) raw.type = type;
  if (raw.call_id == null && raw.callId != null) raw.call_id = raw.callId;
  if (raw.call_type == null && raw.callType != null) raw.call_type = raw.callType;

  return raw;
}

export function isIncomingCallType(type: unknown): boolean {
  const value = String(type || '').toLowerCase();
  return value === 'incoming_call' || value === 'incoming-call' || value === 'call';
}

export function isCallEndedType(type: unknown): boolean {
  const value = String(type || '').toLowerCase();
  return value === 'call_ended' || value === 'call_cancelled' || value === 'missed_call';
}

/** Incoming call even when FCM omits `type` but still sends call_id. */
export function isIncomingCallPayload(data: Record<string, unknown>): boolean {
  if (isCallEndedType(data.type)) return false;
  if (isIncomingCallType(data.type)) return Boolean(data.call_id);
  return Boolean(data.call_id) && Boolean(data.call_type || data.caller_name || data.caller_id);
}
