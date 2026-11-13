/** A cancellable bounded request source, not an independent animation RAF.
 * R3F still owns rendering and all consumers use the same sampled light phase. */
export function lightingFrameDelay(lowQuality:boolean){return lowQuality?100:50;}
export function scheduleLightingFrames(invalidate:()=>void,delay:number,schedule:(callback:()=>void,ms:number)=>unknown=(callback,ms)=>setTimeout(callback,ms),cancel:(id:unknown)=>void=id=>clearTimeout(id as ReturnType<typeof setTimeout>)){
 let stopped=false,id:unknown;
 const tick=()=>{if(stopped)return;invalidate();id=schedule(tick,delay);};
 id=schedule(tick,delay);
 return()=>{stopped=true;cancel(id);};
}
