/** Keep in sync with LiveStreamFeed + Laravel LiveStreamService::index() filters. */

const STALE_HOST_MS = 2.5 * 60 * 1000; // Slightly above server 2m heartbeat window

export function isLiveStreamDiscoverable(item: Record<string, unknown> | null | undefined): boolean {
  if (!item || typeof item !== 'object') return false;

  const isActiveValue =
    item.is_active === true ||
    item.is_active === 1 ||
    item.is_active === '1' ||
    item.is_active === 'true';
  const legacyIsLive =
    item.is_live === true ||
    item.is_live === 1 ||
    item.is_live === '1' ||
    item.is_live === 'true';
  const status = item.status;
  const statusEnded =
    status === 'ended' || status === 'paused' || status === 'inactive';
  const hasNotEnded =
    item.ended_at === null || item.ended_at === undefined || item.ended_at === '';

  if (!((isActiveValue || legacyIsLive) && !statusEnded && hasNotEnded)) {
    return false;
  }

  const hb = item.last_heartbeat_at;
  if (hb != null && hb !== '') {
    const t = new Date(String(hb)).getTime();
    if (Number.isFinite(t) && Date.now() - t > STALE_HOST_MS) {
      return false;
    }
  }

  return true;
}

export function liveStreamListKey(item: Record<string, unknown>): string {
  const id = item?.id ?? '';
  const updated = item?.updated_at ?? '';
  const viewers = item?.current_viewers_count ?? '';
  return `${id}-${updated}-${viewers}`;
}
