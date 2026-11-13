import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Vector3 } from 'three';
import type {MechanismActorBounds} from '../mechanisms/actor-bounds.js';
import type { Racer } from '../../../shared/types.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { PresentationBeat } from '../../presentation.js';
import type { PresentationClock } from '../../presentation-clock.js';
import { MechanismPlayback } from '../mechanisms/playback.js';
import { buildEnvironmentEventCueGeometry, environmentEventCues } from './event-cues.js';

/** Separate from every physical rig so pending/failed scenery can still explain events. */
export function EnvironmentEventCues({track,beat,racers,compact,lowQuality,paused,reducedMotion,clock,startedAt,durationMs,outlets,actorBounds}:{track:TrackId;beat?:PresentationBeat;racers:Racer[];compact:boolean;lowQuality:boolean;paused:boolean;reducedMotion:boolean;clock:PresentationClock;startedAt:number;durationMs:number;outlets?:ReadonlyMap<string,Vector3>;actorBounds?:MechanismActorBounds}) {
  const cues=useMemo(()=>environmentEventCues(track,beat,racers,compact,lowQuality),[track,beat,racers,compact,lowQuality]);
  const playback=useMemo(()=>new MechanismPlayback(),[]);
  const [kit,setKit]=useState<ReturnType<typeof buildEnvironmentEventCueGeometry>>();
  useEffect(()=>{
    const built=buildEnvironmentEventCueGeometry(cues);
    const textures=built.labels.map(({mesh,delta})=>{
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const context=canvas.getContext('2d')!;
      context.fillStyle=delta<0?'#ffbbdd':'#fff0a0';context.strokeStyle='#173f37';context.lineWidth=10;context.font='bold 86px sans-serif';context.textAlign='center';context.textBaseline='middle';const text=`${delta>=0?'+':''}${delta}`;context.strokeText(text,128,66);context.fillText(text,128,66);
      const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;mesh.material.map=texture;mesh.material.needsUpdate=true;return texture;
    });setKit(built);
    return()=>{textures.forEach(texture=>texture.dispose());built.dispose();};
  },[cues]);
  useFrame(({camera})=>{
    if(!kit)return;
    // Resolve the actual glove and visible body, including crowd placement,
    // mounted/changed forms and already-down poses. This is non-contact visual
    // feedback, never an actor-identity gate on the mechanical cycle.
    for(const cue of cues)if(cue.impulse){
      const outlet=outlets?.get(cue.action.anchor.id);
      if(outlet)cue.impulse.from.copy(outlet);
      if(actorBounds)cue.impulse.to.copy(actorBounds.surface(cue.targetId,cue.impulse.from,cue.impulse.to));
    }
    kit.sample(playback.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion),reducedMotion);
    kit.labels.forEach(({mesh})=>mesh.quaternion.copy(camera.quaternion));
  });
  return kit?<primitive object={kit.root} dispose={null}/>:null;
}
