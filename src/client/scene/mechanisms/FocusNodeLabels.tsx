import {useFrame,useThree} from '@react-three/fiber';
import {useMemo,type RefObject} from 'react';
import {Vector3} from 'three';
import type {TrackId} from '../../../shared/tracks.js';
import {boardPoint} from '../math.js';
import {placeFocusLabels} from './focus-labels.js';
/** CSS-sized labels are local focus aids, not a cluttered panorama overlay. */
export function FocusNodeProjector({track,compact,nodes,labels,root}:{track:TrackId;compact:boolean;nodes:readonly number[];labels:RefObject<Map<number,HTMLSpanElement>>;root:RefObject<HTMLElement|null>}){
 const {camera,size}=useThree(),point=useMemo(()=>new Vector3(),[]);
 useFrame(()=>{
  if(!root.current)return;const rect=root.current.getBoundingClientRect();
  const blocked=[...root.current.querySelectorAll<HTMLElement>('.scene-camera-toolbar,.board-minimap,.prediction-hud,.race-intro,.scene-action-banner,.dice-spotlight,.pawn-seat,.score-float')].flatMap(element=>{const r=element.getBoundingClientRect();return r.width&&r.height?[{left:r.left-rect.left,right:r.right-rect.left,top:r.top-rect.top,bottom:r.bottom-rect.top}]:[];});
  const candidates=nodes.map(node=>{const p=boardPoint(node,compact,track);point.set(p[0]+(compact?.6:-.58),p[1]+.03,p[2]+(compact?-.58:-.6)).project(camera);return {node,x:(point.x+1)*size.width/2,y:(1-point.y)*size.height/2,depth:point.z};});
  const visible=new Map(placeFocusLabels(candidates,size.width,size.height,blocked).map(p=>[p.node,p]));
  for(const[node,label]of labels.current){const p=visible.get(node);label.style.visibility=p?'visible':'hidden';if(p)label.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;}
 });
 return null;
}
