/** Posts per feed page — larger pages = fewer scroll gaps. */
export const FEED_PAGE_SIZE = 10;

/** Shared feed infinite-query pagination helper. */
export function getNextFeedPage(lastPage: any): number | undefined {
  if (lastPage?.next_page_url) {
    const url = new URL(lastPage.next_page_url);
    return parseInt(url.searchParams.get('page') || '', 10) || undefined;
  }
  return undefined;
}
