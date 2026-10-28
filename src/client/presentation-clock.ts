/** Local visual time. Pausing never consumes a beat or a die's reading window. */
export class PresentationClock {
  private excluded = 0;
  private frozenAt: number | undefined;
  constructor(private readonly realNow = () => performance.now()) {}
  readonly now = (): number => (this.frozenAt ?? this.realNow()) - this.excluded;
  get paused(): boolean { return this.frozenAt !== undefined; }
  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    const at = this.realNow();
    if (paused) this.frozenAt = at;
    else { this.excluded += at - this.frozenAt!; this.frozenAt = undefined; }
  }
}
export const wallPresentationClock = new PresentationClock();
