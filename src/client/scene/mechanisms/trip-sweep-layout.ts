/** Contact plans belong to the layout visible at the start of one track trip.
 * Viewport changes apply after that beat, so crowd offsets cannot move out from
 * under a frozen world-space sweep while its camera remains responsive. */
export class TripSweepLayout {
  private key: string | undefined;
  private compact = false;
  sample(beatKey: string, requestedCompact: boolean, activeTrackTrip: boolean): boolean {
    if (!activeTrackTrip) { this.key = undefined; return requestedCompact; }
    if (this.key !== beatKey) { this.key = beatKey; this.compact = requestedCompact; }
    return this.compact;
  }
}
