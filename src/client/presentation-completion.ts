/** Give the scene a terminal frame and a paint before replacing the active beat.
 * RAF is deliberately suspended in background tabs. Cancellation invalidates
 * both stages so pause, skip, reconnect and a new beat cannot release old work. */
export function afterPresentationPaint(complete: () => void, request: (callback: FrameRequestCallback) => number = requestAnimationFrame, cancel: (id: number) => void = cancelAnimationFrame): () => void {
  let cancelled = false;
  let frame = request(() => {
    if (cancelled) return;
    frame = request(() => { if (!cancelled) complete(); });
  });
  return () => { cancelled = true; cancel(frame); };
}
