/** Move one item to a new index, shifting the rest. Out-of-range is a no-op copy. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return next;
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

/** True when `orders` lists exactly the values in `existing`, each once. */
export function isSameOrderSet(orders: number[], existing: number[]): boolean {
  if (orders.length !== existing.length) {
    return false;
  }
  const a = orders.slice().sort((x, y) => x - y);
  const b = existing.slice().sort((x, y) => x - y);
  return a.every((value, i) => Number.isInteger(value) && value === b[i] && value !== a[i - 1]);
}
