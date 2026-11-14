export type RaceMenuDismissReason = 'keyboard' | 'outside';

// A nonmodal menu leaves board input and normal Tab navigation available.
export function installRaceMenuDismissal(panel: HTMLElement, trigger: HTMLElement | null, dismiss: (reason: RaceMenuDismissReason) => boolean, doc: Document = document) {
  const hasModal = () => !!doc.querySelector('[aria-modal="true"], dialog[open]');
  const outside = (event: PointerEvent) => {
    if (hasModal() || !event.target || panel.contains(event.target as Node) || trigger?.contains(event.target as Node)) return;
    if (!dismiss('outside')) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const key = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || hasModal()) return;
    event.preventDefault(); event.stopPropagation(); dismiss('keyboard');
  };
  doc.addEventListener('pointerdown', outside, true); doc.addEventListener('keydown', key);
  return () => { doc.removeEventListener('pointerdown', outside, true); doc.removeEventListener('keydown', key); };
}
