import {RoomLightingClock} from '../../src/client/scene-lighting-clock.js';
import {wallPresentationClock} from '../../src/client/presentation-clock.js';
const lightingClock=new RoomLightingClock('stadium-fixture',wallPresentationClock);
// Test-only entry: mount the real board, characters, camera and renderer without a server protocol change.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Board3D } from '../../src/client/scene/Board3D.js';
import type { RoomView, Racer } from '../../src/shared/types.js';
import type { PresentationBeat } from '../../src/client/presentation.js';
import type { TrackId } from '../../src/shared/tracks.js';
const colors = ['#e66d57','#3e9b80','#e1b136','#7167b7','#55a2c2','#d878a0','#839647','#b57d43'];
const characters = ['centaur','banana','egg','huge-baby','alchemist','sisyphus','magician','blimp'];
interface FixtureState { lowQuality: boolean; mode: 'day'|'dusk'|'night'; track: TrackId; position: number; reversed: boolean; mounted: boolean; intro: boolean; paused: boolean; }
declare global { interface Window { stadiumFixture: (state: Partial<FixtureState>) => void; } }
function Fixture() {
 const [state,setState] = useState<FixtureState>({lowQuality:false,mode:'day',track:'mild',position:0,reversed:false,mounted:true,intro:false,paused:false});
 window.stadiumFixture = patch => setState(previous => ({...previous,...patch}));
 const racers: Racer[] = characters.map((characterId,index)=>({id:`r${index}`,playerId:`p${index}`,characterId,position:state.position,tripped:false,finished:false,eliminated:false,flags:{}}));
 const room = { code:'FIXTURE', phase:'race', round:1, track:state.track, role:'player',selfId:'p0',currentRacerId:'r0',trackState:{reversed:state.reversed},players:colors.map((color,index)=>({id:`p${index}`,name:`选手${index+1}`,seat:index,color})),racers,logs:[],results:[] } as unknown as RoomView;
 const beat = state.intro ? {key:'fixture-intro',kind:'intro',durationMs:8000,source:'r0',targets:racers.map(r=>r.id),events:[],motions:[]} as PresentationBeat : undefined;
 return <div style={{position:'fixed',inset:0}}>{state.mounted && <Board3D lightingClock={lightingClock} lightingRunning={false} room={room} racers={racers} beat={beat} startedAt={performance.now()} durationMs={8000} lowQuality={state.lowQuality} reducedMotion muted paused={state.paused} onDetail={()=>{}} {...{appearanceMode:state.mode}} />}</div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
