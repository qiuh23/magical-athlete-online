import { useLayoutEffect, useState } from 'react';
export function useRaceHudGeometry(immersive:boolean,round?:number){
  const [minimapBottom,setMinimapBottom]=useState(90);
  useLayoutEffect(()=>{
    if(!immersive)return;
    // Measure the fixed HUD and lazy scene controls. Choices never participate
    // in these measurements, so mounting one cannot move the chat anchor.
    let map:HTMLElement|null=null;
    const hud=document.querySelector<HTMLElement>('.race-hud-top'),status=document.querySelector<HTMLElement>('.race-status-stack');
    let camera:HTMLElement|null=null;
    const update=()=>{
      const style=document.documentElement.style;
      if(hud)style.setProperty('--race-hud-height',`${Math.ceil(hud.getBoundingClientRect().height)}px`);
      if(camera)style.setProperty('--race-camera-height',`${Math.ceil(camera.getBoundingClientRect().height)}px`);
      if(status)style.setProperty('--race-status-bottom',`${Math.ceil(status.getBoundingClientRect().bottom)}px`);
      if(map){const bottom=Math.ceil(map.getBoundingClientRect().bottom)+12;setMinimapBottom(bottom);style.setProperty('--race-minimap-bottom',`${bottom}px`);}
    };
    const observer=new ResizeObserver(update);
    if(hud)observer.observe(hud);if(status)observer.observe(status);
    const attach=()=>{map=document.querySelector<HTMLElement>('[data-testid="board-minimap"]');camera=document.querySelector<HTMLElement>('.scene-camera-toolbar');if(map&&camera){observer.observe(map);observer.observe(camera);update();return true;}return false;};
    // The scene is lazy-loaded; stop observing DOM as soon as it is ready.
    const mounting=new MutationObserver(()=>{if(attach())mounting.disconnect();});
    if(!attach())mounting.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',update);
    return()=>{observer.disconnect();mounting.disconnect();window.removeEventListener('resize',update);for(const name of ['--race-minimap-bottom','--race-hud-height','--race-camera-height','--race-status-bottom'])document.documentElement.style.removeProperty(name);};
  },[immersive,round]);
  return minimapBottom;
}
