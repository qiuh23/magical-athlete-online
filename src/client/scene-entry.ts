/** Normal game entry selects the released presentation without changing any
 * frozen geometry/placement module. Explicit query overrides remain reversible. */
const PRESENTATION_KEYS = ['environment', 'mechanisms', 'mechanismSpacing'] as const;
export function sceneEntryPath(path: string, inheritedSearch = ''): string {
  const url = new URL(path, 'https://scene-entry.invalid');
  const previous = new URLSearchParams(inheritedSearch);
  // Append only our missing fields; preserve existing query encoding and order.
  const append = (key: string, value: string) => {
    const pair = new URLSearchParams([[key, value]]).toString();
    url.search = url.search ? `${url.search}&${pair}` : `?${pair}`;
  };
  for (const key of PRESENTATION_KEYS) {
    if (!url.searchParams.has(key) && previous.has(key)) append(key, previous.get(key)!);
  }
  for (const key of ['environment', 'mechanisms']) {
    if (!url.searchParams.has(key)) append(key, '1');
  }
  return url.pathname + url.search + url.hash;
}

/** Replace rather than push: startup and Back/Forward add no history entries.
 * If browser history is unavailable the original explicit opt-in behavior remains. */
export function prepareSceneEntry(): void {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search + window.location.hash;
  const next = sceneEntryPath(current);
  if (next === current) return;
  try { window.history.replaceState(window.history.state, '', next); } catch { /* Optional presentation enhancement. */ }
}
