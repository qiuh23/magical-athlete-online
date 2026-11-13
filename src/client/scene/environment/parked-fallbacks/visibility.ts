import {Box3,Matrix4,Vector3} from 'three';
import type {Racer} from '../../../../shared/types.js';
import type {TrackId} from '../../../../shared/tracks.js';
import type {PresentationBeat} from '../../../presentation.js';
import type {SceneMechanismController} from '../scene-mechanisms.js';
import {boardPoint} from '../../math.js';import {pawnOccupancy} from '../../camera.js';
import data from './manifest.json' with {type:'json'};
export const PARKED_FALLBACKS=data;
export type ParkFixture=typeof data.fixtures[number];
export function parkVisible(f:ParkFixture,controller:Pick<SceneMechanismController,'actors'|'actorRadius'>,track:TrackId,compact:boolean,racers:Racer[],beat?:PresentationBeat){
 if(!f.anchor.startsWith(track+':')||beat?.motions.length||typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('mechanismSpacing'))return false;
 const box=new Box3(new Vector3().fromArray(f.envelope[0]!),new Vector3().fromArray(f.envelope[1]!));if(compact)box.applyMatrix4(new Matrix4().makeRotationY(-Math.PI/2));
 return racers.filter(r=>!r.eliminated).every(r=>{const a=controller.actors.get(r.id),radius=controller.actorRadius.get(r.id);if(!a?.ready||!a.staticBind||radius===undefined||!Number.isFinite(radius)||radius<=0)return false;
 const p=boardPoint(r.position,compact,track),o=pawnOccupancy(r,racers,r.position,compact,track),point=new Vector3(p[0]+o.x,p[1]+.005,p[2]+o.z);return box.distanceToPoint(point)>radius*o.scale*2;});
}
