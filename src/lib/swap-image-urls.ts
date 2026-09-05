/** Pure reorder helper — swap two positions. */
export function swapImageUrls(urls: string[], from: number, to: number): string[] {
  if (from < 0 || to < 0 || from >= urls.length || to >= urls.length || from === to) {
    return urls.slice();
  }
  const next = urls.slice();
  const tmp = next[from]!;
  next[from] = next[to]!;
  next[to] = tmp;
  return next;
}
