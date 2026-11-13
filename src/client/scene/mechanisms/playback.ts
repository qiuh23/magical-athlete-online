/** A pause guard on the shared presentation clock. It adds no timer or RAF.
 * If the parent clock is already frozen, the extra excluded time is exactly 0. */
export class MechanismPlayback {
  private key = '';
  private pausedAt: number | undefined;
  private excluded = 0;
  private value = 0;
  sample(key:string,now:number,start:number,duration:number,paused:boolean,reduced:boolean) {
    if(this.key!==key){this.key=key;this.pausedAt=undefined;this.excluded=0;this.value=0;}
    if(paused){this.pausedAt??=now;return this.value;}
    if(this.pausedAt!==undefined){this.excluded+=Math.max(0,now-this.pausedAt);this.pausedAt=undefined;}
    this.value=reduced?1:Math.max(0,Math.min(1,(now-start-this.excluded)/Math.max(1,duration)));
    return this.value;
  }
}
