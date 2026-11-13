import { Color } from 'three';
import { ATHLETE_LIGHT_PRESETS, type AthleteLightMode } from '../StudioLightingV7.js';
const modes=['day','dusk','night'] as const;
export const VENUE_LIGHT_ONSET_PHASE=.8;
/** Keep most daylight fully off, then ease into the existing dusk/night levels. */
export function venueFixtureNightFactor(value:number){
 const p=Math.max(0,Math.min(2,value)),smooth=(t:number)=>t*t*(3-2*t);
 if(p<=VENUE_LIGHT_ONSET_PHASE)return 0;
 return p<=1?.12*smooth((p-VENUE_LIGHT_ONSET_PHASE)/(1-VENUE_LIGHT_ONSET_PHASE)):.12+.88*smooth(p-1);
}
const phase=(mode:AthleteLightMode|number)=>typeof mode==='number'?Math.max(0,Math.min(2,mode)):modes.indexOf(mode);
export function createVenueLightingState(mode:AthleteLightMode|number){return {phase:phase(mode),venue:0,nightFactor:0};}
/** One finite, interruptible phase drives sky, key/shadow direction and local spots. */
export function stepVenueLighting(state:ReturnType<typeof createVenueLightingState>,mode:AthleteLightMode|number,ready:boolean,delta:number,paused=false){
  const target=phase(mode),step=paused?0:Math.min(.05,Math.max(0,delta))*1.8;
  const approach=(a:number,b:number)=>a+Math.sign(b-a)*Math.min(Math.abs(b-a),step);
  state.phase=approach(state.phase,target);state.venue=approach(state.venue,ready?1:0);
  const from=modes[Math.min(1,Math.floor(state.phase))]!,to=modes[Math.min(2,Math.floor(state.phase)+1)]!,mix=state.phase-Math.min(1,Math.floor(state.phase));
  const a=ATHLETE_LIGHT_PRESETS[from],b=ATHLETE_LIGHT_PRESETS[to],lerp=(x:number,y:number)=>x+(y-x)*mix;
  state.nightFactor=venueFixtureNightFactor(state.phase);
  const fixtureFactor=state.nightFactor*state.venue,number=(key:'exposure'|'ambient'|'hemi'|'env'|'keyPower'|'fillPower'|'shadow')=>lerp(a[key],b[key]);
  return {sky:{from,to,mix},nightFactor:fixtureFactor,active:state.phase!==target||state.venue!==(ready?1:0),
    exposure:number('exposure'),ambient:number('ambient'),hemi:number('hemi')-.12*fixtureFactor,env:number('env')+.03*fixtureFactor,
    keyPower:number('keyPower')-1.35*fixtureFactor,fillPower:number('fillPower'),shadow:number('shadow'),
    skyColor:new Color(a.sky).lerp(new Color(b.sky),mix),ground:new Color(a.ground).lerp(new Color(b.ground),mix),key:new Color(a.key).lerp(new Color(b.key),mix),fill:new Color(a.fill).lerp(new Color(b.fill),mix)};
}

/** Disabled zero-output lights must not enter the renderer's local shadow pass. */
export function applyVenueSpotState(light:{intensity:number;visible:boolean},intensity:number,nightFactor:number){
 const factor=Math.max(0,Math.min(1,nightFactor));light.intensity=intensity*factor;light.visible=factor>0;
}
