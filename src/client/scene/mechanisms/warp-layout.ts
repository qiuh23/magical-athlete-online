import type{Racer}from'../../../shared/types.js';import type{TrackId}from'../../../shared/tracks.js';import type{PresentationBeat}from'../../presentation.js';import{pawnOccupancy}from'../camera.js';
/** Unconnected candidate for physical audit. Match the existing fade's fully
 * invisible .4..6 interval; logical movement and occupancy order are unchanged.
 * No actor tilt, skeleton pose, facing, opacity or rule state is modified here. */
export function warpResidentLayout(track:TrackId,compact:boolean,beat:PresentationBeat|undefined,racer:Racer,racers:readonly Racer[],progress:number){
 if(!beat||beat.kind!=='warp'||beat.cause!=='track-whirl'||racer.eliminated||beat.motions.some(m=>m.racerId===racer.id))return;
 if(!beat.motions.some(m=>m.from===racer.position||m.to===racer.position))return;
 const before=pawnOccupancy(racer,racers as Racer[],racer.position,compact,track),afterRacers=racers.map(r=>({...r,position:beat.motions.find(m=>m.racerId===r.id)?.to??r.position})),after=pawnOccupancy(racer,afterRacers,racer.position,compact,track);
 if(before.x===after.x&&before.z===after.z&&before.scale===after.scale)return;
 const v=Math.max(0,Math.min(1,(progress-.4)/.2)),t=v*v*(3-2*v),mix=(a:number,b:number)=>a+(b-a)*t;
 return{x:mix(before.x,after.x),z:mix(before.z,after.z),scale:mix(before.scale,after.scale)};
}
export type WarpTransitionMode='ordinary'|'fade'|'single-resident-reflow'|'hidden-until-snapshot';
/** The finite reflow audit covers native bind bananas at single/two occupancy,
 * both qualities, native standing/down and both roster sides. Larger layouts
 * use a hidden target until the authoritative snapshot updates every slot. */
export function warpTransitionMode(beat:PresentationBeat|undefined,racers:readonly Racer[]):WarpTransitionMode {
 if(!beat||beat.kind!=='warp'||beat.cause!=='track-whirl'||!beat.motions.length)return'ordinary';
 const nodes=new Set(beat.motions.flatMap(m=>[m.from,m.to])),moving=new Set(beat.motions.map(m=>m.racerId)),involved=racers.filter(r=>!r.eliminated&&nodes.has(r.position)),old=involved.filter(r=>!moving.has(r.id));
 if(beat.motions.length!==1)return'hidden-until-snapshot';
 if(!old.length)return'fade';
 const after=racers.map(r=>({...r,position:beat.motions.find(m=>m.racerId===r.id)?.to??r.position}));
 if(involved.some(r=>moving.has(r.id)&&r.tripped)||[...nodes].some(n=>racers.filter(r=>!r.eliminated&&r.position===n).length>2||after.filter(r=>!r.eliminated&&r.position===n).length>2)||involved.some(r=>r.characterId!=='banana'||r.flags.form||r.flags.hogOwnerId))return'hidden-until-snapshot';
 return'single-resident-reflow';
}
export function warpTransitionOpacity(mode:WarpTransitionMode,progress:number){
 const smooth=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
 return mode==='hidden-until-snapshot'?1-smooth(progress/.4):progress<.5?1-smooth(progress/.4):smooth((progress-.6)/.4);
}
/** Reduced motion must not reveal a target before the resident snapshot moves. */
export const warpNeedsOpacity=(mode:WarpTransitionMode,reducedMotion:boolean)=>mode!=='ordinary'&&(!reducedMotion||mode==='hidden-until-snapshot');
