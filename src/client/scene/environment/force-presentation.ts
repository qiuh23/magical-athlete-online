const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const smooth=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
/** Fixed-base magical air punch: wind up, launch pressure, then route movement.
 * This changes presentation timing only, never the authority's path or result. */
export function punchWindStroke(t:number){return t<.22?smooth((t-.08)/.14):1-smooth((t-.22)/.16);}
export function punchWindTravel(t:number,index=0){return clamp((t-.22-index*.018)/.20);}
export function punchWindRoute(t:number){return smooth((t-.48)/.44);}
