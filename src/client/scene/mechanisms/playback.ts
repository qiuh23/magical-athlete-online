/** A pause guard on the shared presentation clock. It adds no timer or RAF.
 * If the parent clock is already frozen, the extra excluded time is exactly 0. */
export class MechanismPlayback {
  private key = '';
  private pausedAt: number | undefined;
  private excluded = 0;
  private value = 0;
  sample(key:string,now:number,start:number,duration:number,paused:boolean,reduced:boolean) {
    if(this.key!==key){this.key=key;this.pausedAt=undefined;this.excluded=0;this.value=0;}
    // A remounted or newly loaded mechanism must join the frozen shared phase,
    // not flash its parked pose or admit an already-late contact plan at t=0.
    // The first paused sample also captures time since the last rendered frame.
    if(paused)this.pausedAt??=now;
    else if(this.pausedAt!==undefined){this.excluded+=Math.max(0,now-this.pausedAt);this.pausedAt=undefined;}
    const at=this.pausedAt??now;
    this.value=reduced?1:Math.max(0,Math.min(1,(at-start-this.excluded)/Math.max(1,duration)));
    return this.value;
  }
}
