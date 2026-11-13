import './asset-loading.js';
import { Suspense, useEffect, useMemo, useCallback, useRef, useState } from 'react';
import {MechanismActorBounds} from './mechanisms/actor-bounds.js';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Racer, RoomView } from '../../shared/types.js';
import { TRACKS, type TrackId } from '../../shared/tracks.js';
import { CHARACTERS } from '../../shared/characters.js';
import { diceResultReadMs, presentationActor, type PresentationBeat } from '../presentation.js';
import { Avatar } from '../avatars.js';
import { Icon, IconButton } from '../Icons.js';
import { RaceMoment } from '../RaceMoment.js';
import { ToyCharacter } from './ToyCharacter.js';
import { MechanismToyCharacter } from './MechanismToyCharacter.js';
import { TripSweepLayout } from './mechanisms/trip-sweep-layout.js';
import { DioramaStadium } from './DioramaStadium.js';
import { WhirlyStadium } from './WhirlyStadium.js';
import { CameraRig } from './CameraRig.js';
import { AdaptiveQuality, PawnContact } from './StudioLighting.js';
import { QualitySuggestionMonitor } from './QualitySuggestionMonitor.js';
import type { QualitySuggestionEvent } from '../QualitySuggestion.js';
import type {SceneAppearance} from '../scene-appearance.js';
import {SCENE_LIGHT_CYCLE_MS,type RoomLightingClock} from '../scene-lighting-clock.js';
import { RaceEffects } from './RaceEffects.js';
import { boardPoint, boardBounds, TILE, trackConnections, trackNodeIds, trackSvgLayout, trackMovementDistance, routeChoice } from './math.js';
import { RouteChoices, RouteButtons } from './RouteChoices.js';
import { TwistPieces } from './TwistPieces.js';
import { DiceSpotlight } from './DiceSpotlight.js';
import { SceneBoundary } from './SceneBoundary.js';
import { pawnRoute, strideLift, strideProgress } from './pawn-motion.js';
import { displayTripFallProgress, pawnFallPose } from './pawn-fall.js';
import {warpResidentLayout,warpTransitionMode,warpTransitionOpacity,warpNeedsOpacity} from './mechanisms/warp-layout.js';
import { MechanismLayer, clearMechanismCache } from './mechanisms/MechanismLayer.js';
import { CertifiedTripController,needsCertifiedBind,certifiedTripMount } from './mechanisms/certified-trip.js';
import {GuardedCertifiedTripController,GuardedPunchController,GuardedTripController} from './mechanisms/runtime-entry-guards.js';
import { CertifiedTripLayer } from './mechanisms/CertifiedTripLayer.js';
import {captureActorGeometry,actorGeometryFingerprint} from './mechanisms/actor-snapshot.js';
import { ApprovedEnvironment, clearEnvironmentCache } from './environment/ApprovedEnvironment.js';
import { rebuiltContactSceneReady, sceneAssetState, type SceneAssetState } from './environment/scene-readiness.js';
import { environmentEnabled, environmentAllowsPhysicalContact } from './environment/layout.js';
import { VenueLighting, clearFloodlightCache } from './environment/VenueLighting.js';
import {punchWindRoute} from './environment/force-presentation.js';
import { FullCoverageMechanismLayer, clearFullCoverageCache } from './environment/FullCoverageMechanismLayer.js';
import { mechanismActions } from './mechanisms/events.js';
import { EnvironmentEventCues } from './environment/EnvironmentEventCues.js';
import { RebuiltMechanismCourse } from './environment/RebuiltMechanismCourse.js';
import { MechanismCourse } from './mechanisms/MechanismCourse.js';
import { mechanismsEnabled, activeMechanismLayout } from './mechanisms/layout.js';
import { FocusNodeProjector } from './mechanisms/FocusNodeLabels.js';
import { PawnOpacity,warpOpacity } from './mechanisms/pawn-opacity.js';
import { mechanismScope } from './mechanisms/scope.js';
import { TripController,residentReflow,tripEntryProfile } from './mechanisms/trip-profile.js';
import { PunchController } from './mechanisms/punch-profile.js';
import { pawnFallPhase, eventScoreDelta } from './mechanisms/events.js';

import { actionFocus, choiceFocus, idleFollowFocus, introFocus, ownFocus, pawnOccupancy, pawnWorldPoint, planCameraShot, type CameraFocus, type CameraMode, type CameraShot } from './camera.js';
import { wallPresentationClock, type PresentationClock } from '../presentation-clock.js';
import './scene.css';

export interface ScenePlayback {
  clock?: PresentationClock;
  paused?: boolean;
  beat?: PresentationBeat;
  queue?: PresentationBeat[];
  racers: Racer[];
  startedAt: number;
  durationMs: number;
}
interface Props extends ScenePlayback {
  room: RoomView;
  lowQuality: boolean;
  /** Optional advice only. The player remains the only quality-setting writer. */
  onQualitySuggestion?: (event: QualitySuggestionEvent) => void;
  /** Local room-time auto cycle or fixed preset. No multiplayer protocol change. */
  appearanceMode?: SceneAppearance;
  lightingClock:RoomLightingClock;
  lightingRunning:boolean;
  reducedMotion: boolean;
  muted: boolean;
  onDetail: (id: string, racerId?: string) => void;
  onSkipIntro?: () => void;
  onIntroReady?: (key:string) => void;
  onDiceSettled?: (key:string) => void;
  introReady?: boolean;
  onChooseRoute?: (optionId: string) => void;
  choiceBusy?: boolean;
}
const characterName = (id: string) => CHARACTERS.find(c => c.id === id)?.nameZh ?? id;
/** Presentation captions describe the existing effect; they are not new rule names. */
const clamp = THREE.MathUtils.clamp;
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const progress = (start: number, duration: number, clock: PresentationClock) => clamp((clock.now() - start) / Math.max(1, duration), 0, 1);
const occupancy = pawnOccupancy;


export function Board3D({ clock = wallPresentationClock, paused = false, room, racers, beat, queue, startedAt, durationMs, lowQuality, onQualitySuggestion, reducedMotion, muted, onDetail, onSkipIntro, onIntroReady, onDiceSettled, introReady = true, appearanceMode = 'auto', lightingClock, lightingRunning, onChooseRoute, choiceBusy = false }: Props) {
  const [resetKey, setResetKey] = useState(0);
  const [sceneFailed, setSceneFailed] = useState(false);
  const retryScene = () => { setSceneFailed(false); setResetKey(n => n + 1); };
  const environmentCandidate = environmentEnabled();
  const [environmentRetry, setEnvironmentRetry] = useState(0);
  const environmentKey = `${room.track}:${environmentRetry}:${resetKey}`;
  const [lightRetry,setLightRetry]=useState(0);
  const [lightsFailed,setLightsFailed]=useState(false);
  useEffect(()=>setLightsFailed(false),[room.track]);
  const lightFailure=useCallback(()=>setLightsFailed(true),[]);
  const [environmentStatus, setEnvironmentStatus] = useState<{key:string;state:SceneAssetState}>({key:'', state:'loading'});
  const environmentLoad = environmentStatus.key === environmentKey ? environmentStatus.state : 'loading';
  const environmentReady = environmentCandidate && environmentLoad === 'ready';
  const environmentOnReady = useCallback(() => setEnvironmentStatus({key:environmentKey,state:'ready'}), [environmentKey]);
  const environmentOnFailure = useCallback(() => setEnvironmentStatus({key:environmentKey,state:'failed'}), [environmentKey]);
  const [mechanismRetry,setMechanismRetry]=useState(0);
  const [padStatus,setPadStatus]=useState<{key:string;state:SceneAssetState}>({key:'',state:'loading'});
  const loadKey=`${room.track}:${mechanismRetry}`;
  const [certifiedFailure,setCertifiedFailure]=useState('');
  const certifiedFailed=certifiedFailure===loadKey;
  const [mechanismStatus,setMechanismStatus]=useState<{key:string;state:'loading'|'ready'|'failed'}>({key:'',state:'loading'});
  const mechanismLoad=mechanismStatus.key===loadKey?mechanismStatus.state:'loading';
  const setMechanismLoad=useCallback((state:'loading'|'ready'|'failed')=>setMechanismStatus(previous=>previous.key===loadKey&&(previous.state===state||previous.state==='failed'&&state==='ready')?previous:{key:loadKey,state}),[loadKey]);
  const mechanismOnReady=useCallback(()=>setMechanismLoad('ready'),[setMechanismLoad]);
  const padKey=`${room.track}:${lowQuality}:${mechanismRetry}:${resetKey}`;
  const padScope=useRef(padKey);padScope.current=padKey;
  const padLoad=sceneAssetState(padKey,padStatus),padFailed=padLoad==='failed';
  const padOnReady=useCallback((ready:boolean)=>{if(padScope.current===padKey)setPadStatus({key:padKey,state:ready?'ready':'loading'});},[padKey]);
  const padOnFailure=useCallback(()=>{if(padScope.current===padKey)setPadStatus({key:padKey,state:'failed'});},[padKey]);
  const spectator = room.role === 'spectator';
  const mechanismCandidate = mechanismsEnabled() && activeMechanismLayout(room.track).lift > 0;
  const [requestedCompact, setCompact] = useState(() => matchMedia('(max-width: 650px)').matches);
  const tripLayoutLock=useMemo(()=>new TripSweepLayout(),[]);
  const compact=tripLayoutLock.sample(`${mechanismScope(room)}:${beat?.key??''}`,requestedCompact,!!(environmentCandidate&&mechanismCandidate&&beat?.kind==='trip'&&beat.events.some(e=>e.type==='trip'&&e.source==='track')));
  const physicalContacts = mechanismCandidate && environmentAllowsPhysicalContact(environmentCandidate);
  const sculptureReaders=useRef(new Map<string,()=>boolean>());
  const contactReady=useCallback(()=>sculptureReaders.current.get(`${beat?.motions[0]?.racerId}:${lowQuality}`)?.()===true,[beat?.motions[0]?.racerId,lowQuality]);
  const sceneMechanisms=rebuiltContactSceneReady({mechanisms:mechanismCandidate,environmentRequested:environmentCandidate,environment:environmentLoad,pads:padLoad,dependenciesFailed:mechanismLoad==='failed'||certifiedFailed});
  const contactScope=mechanismScope(room)+(environmentCandidate?':scene-mechanisms-v1':'');
  const punch = useMemo(()=>new GuardedPunchController(),[contactScope,mechanismRetry,resetKey]);
  // Current scenes have one universally animated hardware owner. Historical
  // contact rigs retain their old opt-out environment path, not the moved R1
  // display mounts. An unknown shape must never suppress the visible cycle.
  const certified=useMemo(()=>{const controller=new GuardedCertifiedTripController(contactScope);try{if(!environmentCandidate)controller.restore(sessionStorage.getItem(`mechanism-down:${contactScope}`)??'');}catch{}return controller;},[contactScope,mechanismRetry,resetKey]);
  const [tripFallback,setTripFallback]=useState<{key:string;reason:'loading'|'space'}>();
  const tripUnavailable=useCallback((key:string,reason:'loading'|'space')=>setTripFallback(previous=>previous?.key===key&&previous.reason===reason?previous:{key,reason}),[]);
  const actorBounds=useMemo(()=>new MechanismActorBounds(),[contactScope,resetKey]);
  const mechanismOutlets=useMemo(()=>new Map<string,THREE.Vector3>(),[contactScope,mechanismRetry,resetKey]);
  certified.enter(room.track,compact,beat,racers,clock.now(),startedAt,durationMs,physicalContacts&&mechanismLoad==='ready'&&(!paused||!!certified.active&&certified.active.key===beat?.key),lowQuality,reducedMotion);
  useEffect(()=>{try{sessionStorage.setItem(`mechanism-down:${contactScope}`,certified.dump());}catch{}},[certified,contactScope,beat?.key]);
  const trip=useMemo(()=>new GuardedTripController(),[contactScope,mechanismRetry,resetKey]);
  const tripReady=useCallback(()=>{const entry=tripEntryProfile(room.track,compact,beat,racers),ids=entry?[entry.newId,entry.oldId]:trip.plan?[trip.plan.newId,trip.plan.oldId]:[];return ids.length===2&&ids.every(id=>sculptureReaders.current.get(`${id}:${lowQuality}`)?.()===true);},[room.track,compact,beat,racers,trip,lowQuality]);
  trip.enter(room.track,compact,beat,racers,clock.now(),startedAt,durationMs,physicalContacts&&mechanismLoad==='ready'&&tripReady()&&!reducedMotion&&(!paused||trip.plan?.key===beat?.key));
  punch.enter(room.track,beat,racers,clock.now(),startedAt,durationMs,physicalContacts&&mechanismLoad==='ready'&&contactReady()&&!reducedMotion&&(!paused||punch.plan?.key===beat?.key));
  const [cameraReset, setCameraReset] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('self');
  const [manualCamera, setManualCamera] = useState(false);
  const [autoWatch, setAutoWatch] = useState(() => { try { return localStorage.getItem('magical-athlete:auto-watch') !== 'false'; } catch { return true; } });
  const [heldFocus, setHeldFocus] = useState<CameraFocus | null>(null);
  const [dismissedChain, setDismissedChain] = useState<string>();
  const [lost, setLost] = useState(false);
  const [introStep, setIntroStep] = useState({key:'',index:0});
  useEffect(()=>{
    if(beat?.kind!=='intro'||!introReady||paused)return;
    let timer:ReturnType<typeof setTimeout>;
    const update=()=>{
      const elapsed=Math.max(0,clock.now()-startedAt),step=durationMs/Math.max(1,beat.targets.length);
      const index=reducedMotion?0:Math.min(beat.targets.length-1,Math.floor(elapsed/step));
      setIntroStep({key:beat.key,index});
      if(!reducedMotion&&index<beat.targets.length-1)timer=setTimeout(update,Math.max(1,step-elapsed%step));
    };
    update();return()=>clearTimeout(timer);
  },[beat?.key,startedAt,durationMs,reducedMotion,introReady,paused,clock]);
  const root = useRef<HTMLElement>(null);
  const previousShot = useRef<CameraShot | undefined>(undefined);
  const labels = useRef(new Map<string, HTMLSpanElement>());
  const nodeLabels=useRef(new Map<number,HTMLSpanElement>());
  const routeButtons = useRef(new Map<string, HTMLButtonElement>());
  const scoreLabel = useRef<HTMLSpanElement>(null);
  useEffect(() => { const m = matchMedia('(max-width: 650px)'); const update = () => setCompact(m.matches); m.addEventListener('change', update); return () => m.removeEventListener('change', update); }, []);
  useDiceSound(beat, startedAt, durationMs, muted, paused, clock);
  const active = beat ? beat.source : room.currentRacerId;
  const selected = presentationActor(beat,racers);
  const dice = beat?.kind === 'dice' || beat?.kind === 'duel-dice';
  const duelContenders = beat?.kind === 'duel-dice' && beat.faces?.length === 2 ? beat.targets.slice(0, 2).flatMap((id, index) => { const racer = racers.find(value => value.id === id); return racer ? [{ racerId: id, characterId: racer.characterId, name: characterName(racer.characterId), face: beat.faces![index]! }] : []; }) : undefined;
  const currentAction = beat && beat.kind !== 'intro' ? actionFocus(beat, racers, room) : null;
  const action = currentAction?.positions.length ? currentAction : null;
  const shot = action && beat ? planCameraShot(beat, racers, queue ?? [], { track: room.track, trackState: room.trackState, compact, width: root.current?.clientWidth || window.innerWidth, height: root.current?.clientHeight || window.innerHeight }, previousShot.current) : undefined;
  useEffect(() => {
    if (action) setHeldFocus(action);
  }, [beat?.key]);
  useEffect(() => { previousShot.current = shot; });
  const myAction = action?.ids.some(id => racers.some(racer => racer.id === id && racer.playerId === room.selfId));
  const choosing = !beat && !(queue?.length) ? choiceFocus(room, racers) : undefined;
  const route = choosing && onChooseRoute ? routeChoice(room) : undefined;
  const introIndex = introStep.key === beat?.key ? introStep.index : 0;
  const intro = {focus:beat?.kind==='intro'?introFocus(racers,introIndex,reducedMotion):undefined,racer:beat?.kind==='intro'&&!reducedMotion?racers[introIndex]:undefined,index:introIndex,total:racers.length,reducedMotion,skip:()=>{if(beat?.kind==='intro')onSkipIntro?.();}};
  const idleFocus = autoWatch && heldFocus && heldFocus.chainId !== dismissedChain ? idleFollowFocus(room, racers, heldFocus) : ownFocus(room, racers);
  const focus: CameraFocus = route && choosing ? choosing : cameraMode === 'overview' ? { state: 'overview', ids: active ? [active] : [], positions: [] } : choosing ?? (manualCamera ? { state: 'manual', ids: [], positions: [] } : intro.focus ?? (action && action.chainId !== dismissedChain && (autoWatch || myAction) ? shot!.focus : idleFocus));
  const focusNodes=mechanismCandidate&&!['overview','manual','intro'].includes(focus.state)?[...new Set([...focus.ids.flatMap(id=>racers.filter(r=>r.id===id).map(r=>r.position)),...focus.positions])].filter(id=>trackNodeIds(room.track).includes(id)).slice(0,8):[];
  const showTallDecor = focus.state === 'overview' && cameraMode === 'overview' && beat?.kind !== 'intro' && !choosing && !route;
  const returnSelf = () => { intro.skip(); setCameraMode('self'); setManualCamera(false); setDismissedChain(action?.chainId ?? heldFocus?.chainId ?? 'manual-self'); setCameraReset(value => value + 1); };
  return <section ref={root} className={`board-scene ${compact ? 'compact-scene' : ''}`} data-testid="board-3d" data-scene-failed={String(sceneFailed || lost)} data-track={room.track} data-environment-candidate={String(environmentCandidate)} data-environment-load={environmentCandidate?environmentLoad:undefined} data-contact-mode={environmentCandidate?'trip-geometry-sweep-other-outboard':undefined} data-pad-load={environmentCandidate&&mechanismCandidate?padLoad:undefined} data-mechanism-candidate={String(mechanismCandidate)} data-mechanism-load={mechanismCandidate?mechanismLoad:undefined} data-scene-contact-assets-ready={String(sceneMechanisms)} data-appearance-mode={appearanceMode} data-lighting-cycle-ms={SCENE_LIGHT_CYCLE_MS} data-lighting-running={String(lightingRunning)} data-tall-decor={String(showTallDecor)} data-node-count={trackNodeIds(room.track).length} data-twist-boundary={TRACKS[room.track].twistBoundary?`${TRACKS[room.track].twistBoundary!.before}-${TRACKS[room.track].twistBoundary!.after}`:undefined} data-neutral-monster={room.trackState?.twist?.monster&&!room.trackState.twist.monster.racerId&&!room.trackState.twist.monster.finished?room.trackState.twist.monster.position:undefined} data-twist-chips={room.trackState?.twist?.chips?.join(',')} data-special-event={room.trackState?.event?.id} data-event-marker={room.trackState?.event?.npc?.position} data-trampolines={room.trackState?.event?.trampolines?.join(',')} data-phase={beat?.kind ?? 'idle'} data-intro-ready={String(introReady)} data-event-ids={beat?.events.map(e => e.id).join(',') ?? ''} data-motion-count={beat?.motions.length ?? 0} data-renderer="react-three-fiber" data-playback-paused={String(paused)} data-frameloop={paused ? 'demand' : beat && beat.kind!=='intro' && !dice && !reducedMotion ? 'always' : 'demand'} data-camera-mode={cameraMode} data-camera-state={focus.state} data-camera-target-ids={focus.ids.join(',')} data-camera-chain-id={focus.chainId ?? ''} data-camera-positions={focus.positions.join(',')} data-camera-piece={focus.piece} data-camera-shot={shot?.keys.join(',')} aria-label={`${TRACKS[room.track].name}立体棋盘`}>
    {mechanismCandidate && (mechanismLoad==='failed'||padFailed||certifiedFailed) && <p className="mechanism-load-error" role="status">部分机关或跑垫素材载入失败，使用临时跑面，规则仍可继续。<button onClick={()=>{clearMechanismCache(room.track);clearFullCoverageCache(room.track);setPadStatus({key:padKey,state:'loading'});setCertifiedFailure('');setMechanismLoad('loading');setMechanismRetry(n=>n+1);}}>重新载入机关</button></p>}
    {tripFallback?.key===beat?.key&&tripFallback&&<p className="mechanism-load-error" role="status">{tripFallback.reason==='loading'?'角色素材尚未就绪，本次省略绊倒演出。':'格上空间不足，本次省略绊倒演出。'}游戏结果照常结算。</p>}
    {environmentCandidate&&environmentLoad==='failed'&&<p className="mechanism-load-error" role="status">环境素材载入失败，已保留原场景与规则。<button onClick={()=>{clearEnvironmentCache(room.track);setEnvironmentRetry(n=>n+1);}}>重新载入环境</button></p>}
    {environmentCandidate&&lightsFailed&&<p className="mechanism-load-error" role="status">场边灯具载入失败，保留月光与场景。<button onClick={()=>{clearFloodlightCache();setLightsFailed(false);setLightRetry(n=>n+1);}}>重新载入灯具</button></p>}
    <div className="scene-camera-toolbar">
      {sceneFailed || lost ? <span className="camera-unavailable" role="status">3D 镜头暂不可用</span> : <>
      <IconButton icon="focus" label="恢复默认视角" className="camera-home" onClick={returnSelf} />
      <details className="camera-options"><summary aria-label="镜头设置" title="镜头设置"><Icon kind="camera" /></summary><div className="camera-settings-content">
        <div className="scene-camera-modes" role="group" aria-label="棋盘视角"><button aria-pressed={cameraMode === 'self'} aria-label={spectator ? '跟随当前选手' : '自己'} onClick={returnSelf}><Icon kind="follow" size={18} />{spectator ? '跟随' : '自己'}</button><button aria-pressed={cameraMode === 'overview'} onClick={() => { intro.skip(); setCameraMode('overview'); setManualCamera(false); setCameraReset(value => value + 1); }}><Icon kind="overview" size={18} />总览</button></div>
        <label><input type="checkbox" aria-label={spectator ? '自动跟随赛场行动' : '自动观看他人行动'} checked={autoWatch} onChange={event => { setAutoWatch(event.target.checked); try { localStorage.setItem('magical-athlete:auto-watch', String(event.target.checked)); } catch { /* Preferences are optional. */ } }} />{spectator ? '自动跟随赛场行动' : '自动观看他人行动'}</label><small>拖动平移 · 双指或滚轮缩放</small>
      </div></details>
      {manualCamera && cameraMode === 'self' && !choosing && <span className="camera-paused" role="status">跟拍已暂停</span>}
      </>}
    </div>
    {intro.focus && <div className="race-intro" data-testid="race-intro" data-intro-index={intro.index} role="status">
      {intro.racer && <button type="button" className="race-intro-avatar board-avatar-button" onClick={() => onDetail(intro.racer!.characterId, intro.racer!.id)} aria-label={`查看${characterName(intro.racer.characterId)}技能与当前玩家`}><Avatar id={intro.racer.characterId} /></button>}
      <div><small>{!introReady ? '正在载入选手模型' : intro.reducedMotion ? '全体选手就位' : `选手亮相 · ${intro.index + 1} / ${intro.total}`}</small><strong>{intro.racer ? characterName(intro.racer.characterId) : '准备开赛！'}</strong></div>
      <button onClick={returnSelf} aria-label="跳过选手介绍">跳过 ›</button>
    </div>}
    <Minimap clock={clock} paused={paused} room={room} racers={racers} active={active} beat={beat} startedAt={startedAt} durationMs={durationMs} reducedMotion={reducedMotion} onDetail={onDetail} />
    <PredictionHud room={room} racers={racers} choosing={!!choosing} onDetail={onDetail} />
    {!beat && !queue?.length && <PublicDiceSummary room={room} racers={racers} onDetail={onDetail} />}
    <SceneBoundary resetKey={resetKey} retry={retryScene} onFailure={() => setSceneFailed(true)}>
      <Canvas className="board-webgl" key={resetKey} frameloop={paused ? 'demand' : beat && beat.kind!=='intro' && !dice && !reducedMotion ? 'always' : 'demand'} orthographic shadows={!lowQuality} dpr={lowQuality ? 1 : [1, compact ? 1.25 : 1.5]} camera={{ position: [3, 16, 16], near: .1, far: 100, zoom: 35 }} gl={{ antialias: !lowQuality, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.setClearColor('#c7dfd3'); gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.shadowMap.type = THREE.PCFShadowMap; gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); setLost(true); }); gl.domElement.addEventListener('webglcontextrestored', () => setLost(false)); }}>
        <VenueLighting key={`${room.track}:${lightRetry}`} track={room.track} compact={compact} lowQuality={lowQuality} mode={appearanceMode} lightingClock={lightingClock} lightingRunning={lightingRunning} fixturesEnabled={environmentReady} paused={paused} onFailure={lightFailure} boardExtent={boardBounds(room.track,compact)}/>
        <AdaptiveQuality lowQuality={lowQuality} root={root} />
        <QualitySuggestionMonitor scope={`${room.code}:${room.round}:${room.track}`} enabled={!lowQuality && !reducedMotion && !paused && !sceneFailed && !lost && introReady && (!environmentCandidate || environmentLoad !== 'loading')} onSuggestion={onQualitySuggestion} />
        <CameraRig paused={paused} track={room.track} racers={racers} compact={compact} reset={cameraReset} focus={focus} reducedMotion={reducedMotion} onManual={() => { intro.skip(); setManualCamera(true); }} root={root} />
        {mechanismCandidate ? (environmentCandidate ? <RebuiltMechanismCourse environmentReady={environmentReady} key={padKey} onPadReady={padOnReady} onPadFailure={padOnFailure} track={room.track} compact={compact} lowQuality={lowQuality} showTallDecor={showTallDecor}/> : <MechanismCourse key={mechanismRetry} onPadFailure={padOnFailure} track={room.track} compact={compact} lowQuality={lowQuality} showTallDecor={showTallDecor}/>) : room.track === 'whirly-world'&&!environmentReady
          ? <WhirlyStadium compact={compact} lowQuality={lowQuality} fallback={<DioramaStadium environmentReady={environmentReady} compact={compact} track={room.track} lowQuality={lowQuality} beat={beat} racers={racers} showTallDecor={showTallDecor} />} />
          : <DioramaStadium environmentReady={environmentReady} compact={compact} track={room.track} reversed={room.trackState?.reversed} lowQuality={lowQuality} beat={beat} racers={racers} showTallDecor={showTallDecor} />}
        {environmentCandidate&&<ApprovedEnvironment key={environmentKey} reversed={room.trackState?.reversed} track={room.track} compact={compact} lowQuality={lowQuality} onReady={environmentOnReady} onFailure={environmentOnFailure}/>}
        {mechanismCandidate&&environmentCandidate&&<EnvironmentEventCues actorBounds={actorBounds} outlets={mechanismOutlets} {...{track:room.track,beat,racers,compact,lowQuality,paused,reducedMotion,clock,startedAt,durationMs}}/>}
        {mechanismCandidate&&environmentCandidate&&<FullCoverageMechanismLayer onTripUnavailable={tripUnavailable} actorBounds={actorBounds} outlets={mechanismOutlets} key={`coverage:${room.track}:${mechanismRetry}`} onReady={mechanismOnReady} onFailure={()=>setMechanismLoad('failed')} physicalVisible={()=>false} {...{track:room.track,compact,lowQuality,racers,beat,clock,startedAt,durationMs,paused,reducedMotion}}/>}
        {physicalContacts && <MechanismLayer certified={certified} trip={trip} tripReady={tripReady} contactReady={contactReady} punch={punch} key={mechanismRetry} paused={paused} onLoadState={setMechanismLoad} {...{track:room.track,compact,racers,beat,clock,startedAt,durationMs,reducedMotion,lowQuality,root}}/>}
        {physicalContacts&&<CertifiedTripLayer onFailure={()=>setCertifiedFailure(loadKey)} key={`certified:${mechanismRetry}`} controller={certified} racers={racers} {...{track:room.track,compact,lowQuality,paused,reducedMotion,beat,clock,startedAt,durationMs,root}}/>}
        {route && <RouteChoices {...{ route, compact }} track={room.track} buttons={routeButtons} />}
        <Suspense fallback={null}><TwistPieces {...{ room, compact, lowQuality, reducedMotion }} />{racers.filter(r => !r.eliminated || beat?.kind === 'eliminate' && beat.targets.includes(r.id)).map(racer => <Pawn actorBounds={actorBounds} physicalContacts={physicalContacts} certified={certified} trip={trip} sculptureReaders={sculptureReaders} punch={punch} paused={paused} clock={clock} key={racer.id} racer={racer} racers={racers} room={room} compact={compact} beat={beat} startedAt={startedAt} durationMs={durationMs} lowQuality={lowQuality} reducedMotion={reducedMotion} active={active === racer.id} onDetail={onDetail} labels={labels} />)}</Suspense>
        <RaceEffects tripContact={environmentCandidate&&mechanismCandidate?{targets:new Set(mechanismActions(room.track,beat,racers).filter(a=>a.anchor.kind==='trip').flatMap(a=>a.targets)),hit:(id:string)=>actorBounds.tripHit(beat?.key??'',id)}:undefined} clock={clock} track={room.track} reversed={room.trackState?.reversed} {...{ beat, racers, compact, startedAt, durationMs, reducedMotion, lowQuality }} />
        <FocusNodeProjector track={room.track} compact={compact} nodes={focusNodes} labels={nodeLabels} root={root}/>
        <ScoreProjector track={room.track} beat={beat} racers={racers} compact={compact} label={scoreLabel} />
        <PerformanceProbe root={root} />
        <IntroReadiness beat={beat} count={racers.filter(racer=>!racer.eliminated).length} onReady={onIntroReady} root={root} />
      </Canvas>
    </SceneBoundary>
    {route && onChooseRoute && <RouteButtons route={route} buttons={routeButtons} disabled={choiceBusy} onChoose={onChooseRoute} />}
    <div className="scene-labels" aria-hidden="true">{focusNodes.map(node=><span key={`node:${node}`} className="mechanism-focus-node" ref={element=>{if(element)nodeLabels.current.set(node,element);else nodeLabels.current.delete(node);}}>{node}</span>)}{racers.filter(r => !r.eliminated).map(racer => { const owner = room.players.find(p => p.id === racer.playerId), scale = occupancy(racer, racers, racer.position, compact, room.track).scale; return <span key={racer.id} data-racer-id={racer.id} ref={element => { if (element) labels.current.set(racer.id, element); else labels.current.delete(racer.id); }} className={`pawn-seat ${active === racer.id ? 'is-active' : ''} ${scale < .5 ? 'is-crowded' : scale < .9 ? 'is-shared' : ''}`} style={{ borderColor: owner?.color }}>{(owner?.seat ?? 0) + 1}</span>; })}<span ref={scoreLabel} className="score-float" style={{ display: beat?.kind === 'score' || beat?.kind === 'finish' ? undefined : 'none' }}>{scoreCaption(beat) ?? (beat?.kind === 'finish' ? '冲线！' : '得分！')}</span></div>
    {lost && !sceneFailed && <div className="scene-fallback" role="status"><strong>正在恢复图形画面…</strong><button onClick={() => { setLost(false); retryScene(); }}>重新载入 3D</button></div>}
    <SceneBoundary resetKey={resetKey} retry={retryScene} fallback={dice && !sceneFailed ? <div className="dice-spotlight dice-fallback" role="status"><strong>骰子动画暂时无法显示</strong><p>点数仍按本次掷骰结果结算，可跳过动画继续。</p><button onClick={retryScene}>重新载入骰子动画</button></div> : null}><DiceSpotlight rendererResetKey={resetKey} onRetryRenderer={retryScene} clock={clock} paused={paused} resultReadMs={diceResultReadMs(beat)} onSettled={onDiceSettled} active={dice} beatKey={dice ? beat?.key : undefined} contenders={duelContenders} face={beat?.face ?? room.lastRoll?.face ?? 1} faces={beat?.faces} cause={beat?.cause} triggered={beat?.events[0]?.type==='die-trigger'} reason={beat?.events.find(event=>event.rollReason)?.rollReason} detail={beat?.events.map(event=>event.text).join(" · ")} sourceRacerId={selected.racerId} sourceCharacterId={selected.characterId} stageActor={!!beat?.actor} onDetail={onDetail} startedAt={startedAt} durationMs={durationMs} reducedMotion={reducedMotion} lowQuality={lowQuality} source={selected.name} /></SceneBoundary>
    <RaceMoment room={room} beat={beat} racers={racers} onDetail={onDetail} />
    <ul className="sr-only" aria-label="立体棋盘选手位置">{racers.map(r => <li key={r.id} data-testid="scene-racer" data-racer-id={r.id} data-position={r.position} data-target-position={beat?.motions.find(m => m.racerId === r.id)?.to ?? r.position}>{characterName(r.characterId)} · {r.position} 格{r.tripped ? ' · 绊倒' : ''}</li>)}</ul>
  </section>;
}

/** Readiness is local to this canvas, never an acknowledgement to authority.
 * Slow chunk/model loading cannot consume the entrants' visible screen time. */
function IntroReadiness({beat,count,onReady,root}:{beat?:PresentationBeat;count:number;onReady?:Props['onIntroReady'];root:React.RefObject<HTMLElement|null>}) {
  const {scene}=useThree();const sent=useRef<string|undefined>(undefined);
  useFrame(()=>{
    if(beat?.kind!=='intro'||sent.current===beat.key)return;
    let ready=0,failed=0,pending=0;
    scene.traverse(object=>{
      if(!object.userData.racerModel)return;
      // Count exactly one main sculpture per racer. Mounts and pending
      // Suspense placeholders cannot satisfy another racer's readiness.
      const main=object.children.find(child=>child.userData.racerMainSculpture);
      const state=main?.children.find(child=>child.userData.sculptureState)?.userData.sculptureState;
      if(state==='ready')ready++;else if(state==='failed')failed++;else pending++;
    });
    if(root.current){root.current.dataset.readyModels=String(ready);root.current.dataset.failedModels=String(failed);root.current.dataset.pendingModels=String(pending);}
    if(ready+failed>=count){sent.current=beat.key;onReady?.(beat.key);}
  });
  return null;
}

function PerformanceProbe({ root }: { root: React.RefObject<HTMLElement | null> }) {
  const { gl, scene } = useThree();
  const frameCount = useRef(0);
  useEffect(() => {
    const previous = scene.onAfterRender;
    // Model readiness is diagnostic metadata, not a per-frame rendering task.
    // In an eight-client room, keep graph walks off the animation hot path.
    const reportModels = () => {
      if (!root.current) return;
      let loaded = 0, fallbacks = 0;
      scene.traverse(object => { if (object.name.startsWith('toy_')) loaded++; if (object.name === 'procedural-racer-fallback') fallbacks++; });
      root.current.dataset.loadedModels = String(loaded); root.current.dataset.modelFallbacks = String(fallbacks);
      root.current.dataset.trackModel = scene.getObjectByName('track_whirly_world') ? 'whirly-world' : scene.getObjectByName('stadium-v9-models') ? 'stadium-v9' : 'procedural';
      root.current.dataset.stadiumTallCount = String(['athlete_scoreboard','athlete_bunting'].filter(name => scene.getObjectByName(name)).length);
    };
    reportModels();
    const modelReport = setInterval(reportModels, 500);
    scene.onAfterRender = function (...args) {
      previous.apply(this, args);
      if (root.current) {
        root.current.dataset.drawCalls = String(gl.info.render.calls); root.current.dataset.triangles = String(gl.info.render.triangles);
        root.current.dataset.renderFrameCount = String(++frameCount.current);
        root.current.dataset.geometries = String(gl.info.memory.geometries);
        root.current.dataset.textures = String(gl.info.memory.textures);
        root.current.dataset.programs = String(gl.info.programs?.length ?? 0);
      }
    };
    return () => { clearInterval(modelReport); scene.onAfterRender = previous; };
  }, [gl, scene, root]);
  return null;
}
function PublicDiceSummary({room,racers,onDetail}:{room:RoomView;racers:Racer[];onDetail:Props['onDetail']}) {
  const boundary=room.logs.findLast(event=>event.type==='turn'||event.type==='reveal')?.id??0;
  const batch=room.logs.findLast(event=>event.type==='multi-dice'&&event.id>boundary);
  const actor=racers.find(racer=>racer.id===batch?.source);
  if(!actor||batch?.faces?.length!==6)return null;
  return <aside className="public-dice-summary" data-testid="public-six-dice" aria-label={`${characterName(actor.characterId)}六骰公开结果`}><button type="button" className="board-avatar-button" onClick={()=>onDetail(actor.characterId,actor.id)} aria-label={`查看${characterName(actor.characterId)}技能与当前玩家`}><Avatar id={actor.characterId}/></button><div><strong>{characterName(actor.characterId)} · 六骰公开结果</strong><span>{batch.faces.map((face,index)=><b key={index}>{face}</b>)}</span><small>{new Set(batch.faces).size===6?'六骰均不同 · 等待重掷整组':room.waitingFor?'等待选择重复点数':'本次掷骰结果'}</small></div></aside>;
}
function Minimap({ clock, paused, room, racers, active, beat, startedAt, durationMs, reducedMotion, onDetail }: { clock: PresentationClock; paused: boolean; room: RoomView; racers: Racer[]; active?: string; beat?: PresentationBeat; startedAt: number; durationMs: number; reducedMotion: boolean; onDetail:Props['onDetail'] }) {
  const [tick, setTick] = useState(1);
  useEffect(() => {
    if (reducedMotion || !beat?.motions.length) { setTick(1); return; }
    let animation: number;
    const update = () => { const value = progress(startedAt, durationMs, clock); setTick(value); if (value < 1 && !paused) animation = requestAnimationFrame(update); };
    update(); return () => cancelAnimationFrame(animation);
  }, [beat?.key, startedAt, durationMs, reducedMotion, paused, clock]);
  const topology = !!TRACKS[room.track].nodes || activeMechanismLayout(room.track).lift > 0, mapLayout = trackSvgLayout(room.track, 220, 104, 24);
  const mapPoint = (position: number) => { if (topology) return mapLayout.point(position); const point = boardPoint(position, false, room.track); return { x: 32 + (point[0] / TILE + 7.5) * 10.3, y: 28 + (point[2] / TILE + 1.5) * 15 }; };
  const currentPosition = (racer: Racer) => {
    const motion = beat?.motions.find(value => value.racerId === racer.id);
    if (!motion) return racer.position;
    if (beat?.kind !== 'move') return tick < .5 ? motion.from : motion.to;
    const step = ease(clamp((tick - .06) / .88, 0, 1)) * Math.max(0, motion.path.length - 1);
    const at = Math.min(motion.path.length - 1, Math.floor(step));
    return topology ? motion.path[at] ?? motion.from : THREE.MathUtils.lerp(motion.path[at] ?? motion.from, motion.path[Math.min(at + 1, motion.path.length - 1)] ?? motion.to, step - at);
  };
  const currentMapPoint = (racer: Racer) => {
    const motion = beat?.motions.find(value => value.racerId === racer.id);
    if (!topology || !motion || beat?.kind !== 'move') return mapPoint(currentPosition(racer));
    const step = ease(clamp((tick - .06) / .88, 0, 1)) * Math.max(0, motion.path.length - 1), at = Math.floor(step);
    const first = mapPoint(motion.path[at] ?? motion.to), second = mapPoint(motion.path[Math.min(at + 1, motion.path.length - 1)] ?? motion.to);
    return { x: THREE.MathUtils.lerp(first.x, second.x, step - at), y: THREE.MathUtils.lerp(first.y, second.y, step - at) };
  };
  const ownRacers = racers.filter(racer => racer.playerId === room.selfId);
  const others = racers.filter(racer => racer.playerId !== room.selfId);
  const visibleRacers = racers.filter(racer => !racer.eliminated);
  const ownMarker = (racer: Racer) => ownRacers.length > 1 ? String.fromCharCode(65 + ownRacers.findIndex(value => value.id === racer.id)) : '你';
  const positionText = (racer: Racer) => {
    if (racer.eliminated) return '已出局';
    return `第${Math.round(currentPosition(racer))}格`;
  };
  const positionDetail = (racer: Racer) => {
    if (racer.eliminated) return '';
    const position = Math.round(currentPosition(racer)), definition = TRACKS[room.track];
    const layer = definition.bridges?.find(([upper, lower]) => upper === position || lower === position);
    return room.track === 'boardwalks' ? `距终点 ${definition.remaining?.[position]} 格` : layer ? layer[0] === position ? '桥上' : '桥下' : '';
  };
  return <aside className="board-minimap" data-testid="board-minimap" aria-label="赛道小地图">
    <div className="minimap-heading"><span>{room.trackState?.reversed ? '反向赛道' : '赛道小地图'}</span><span><i />{room.role === 'spectator' ? '选手位置' : '你的位置'}</span></div>
    <svg className="minimap-track" viewBox="0 0 220 104" aria-hidden="true">
      {trackConnections(room.track).map(([from, to]) => { const a = mapPoint(from), b = mapPoint(to); return <g key={`${from}-${to}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d9e5da" strokeWidth={topology ? 9 : 15} strokeLinecap="round" /><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#62877b" strokeWidth={topology ? 4 : 8} strokeLinecap="round" /></g>; })}
      {[0, 5, 10, 12, 15, 20, 25, 30].map(index => { const point = mapPoint(index), upper = index <= 12; return <g key={index} data-map-node={index}><circle cx={point.x} cy={point.y} r="1.8" fill="#ecf5e8" /><text x={point.x} y={point.y + (upper ? -14 : 18)} textAnchor="middle">{index === 0 ? room.trackState?.reversed ? '终点' : '起点' : index === 30 ? room.trackState?.reversed ? '起点' : '终点' : index}</text></g>; })}
      {[...visibleRacers].sort((first, second) => Number(first.playerId === room.selfId) - Number(second.playerId === room.selfId)).map(racer => {
        const point = currentMapPoint(racer), owner = room.players.find(player => player.id === racer.playerId), own = racer.playerId === room.selfId;
        const peers = visibleRacers.filter(value => { const other = mapPoint(currentPosition(value)), own = mapPoint(currentPosition(racer)); return Math.hypot(other.x - own.x, other.y - own.y) < .1; }), index = peers.findIndex(value => value.id === racer.id);
        const cols = Math.min(3, peers.length), rows = Math.ceil(peers.length / cols);
        const x = point.x + (index % cols - (cols - 1) / 2) * 14, y = point.y + (Math.floor(index / cols) - (rows - 1) / 2) * 14;
        return <g key={racer.id} data-map-racer-id={racer.id} className={`${own ? 'minimap-self' : ''} ${active === racer.id ? 'minimap-active' : ''}`}>
          {peers.length > 1 && <line x1={point.x} y1={point.y} x2={x} y2={y} stroke={own ? '#b68b23' : '#668675'} strokeWidth="1" opacity=".65" />}
          <g transform={`translate(${x},${y})`}>
            {own && <circle r="11" fill="#ffd967" fillOpacity=".4" stroke="#c79a2b" strokeWidth="1.2" />}
            {active === racer.id && <circle r={own ? 13 : 9} fill="none" stroke="#216858" strokeWidth="1.8" strokeDasharray="3 2" />}
            <circle r={own ? 8 : 5.7} fill={own ? '#285e54' : owner?.color ?? '#fff'} stroke={own ? '#fff8d8' : '#fff9e6'} strokeWidth={own ? 2 : 1.5} />
            <text className={own ? 'minimap-own-marker' : 'minimap-seat-marker'} textAnchor="middle" dominantBaseline="central">{own ? ownMarker(racer) : (owner?.seat ?? 0) + 1}</text>
          </g>
        </g>;
      })}
    </svg>
    <div className="minimap-own-positions">{ownRacers.map(racer => <div key={racer.id} data-testid="minimap-own-position" data-racer-id={racer.id} data-position={Math.round(currentPosition(racer))} className={`minimap-own-position ${active === racer.id ? 'is-active' : ''}`} aria-label={`你，${characterName(racer.characterId)}，${positionText(racer)}`}>
      <button type="button" className="minimap-own-avatar board-avatar-button" onClick={() => onDetail(racer.characterId, racer.id)} aria-label={`查看${characterName(racer.characterId)}技能与当前玩家`}><Avatar id={racer.characterId} />{ownRacers.length > 1 && <b>{ownMarker(racer)}</b>}</button>
      <span><strong>{racer.eliminated ? <Icon kind="eliminate" size={20} /> : Math.round(currentPosition(racer))}</strong>{positionDetail(racer) && <small>{positionDetail(racer)}</small>}{(racer.finished || racer.tripped) && <Icon kind={racer.finished ? 'flag' : 'trip'} size={16} />}</span>
      {active === racer.id && <i title="正在行动" />}
    </div>)}</div>
    {others.length > 0 && <div className="minimap-positions" aria-label="其他选手位置">{others.map(racer => { const owner = room.players.find(player => player.id === racer.playerId); return <span key={racer.id} data-racer-id={racer.id} data-position={Math.round(currentPosition(racer))} className={active === racer.id ? 'is-active' : ''} style={{ borderColor: owner?.color }} aria-label={`${(owner?.seat ?? 0) + 1}号选手，${characterName(racer.characterId)}，${positionText(racer)}`}><i style={{ background: owner?.color }} /><small>{(owner?.seat ?? 0) + 1}号</small><b>{racer.eliminated ? '出局' : <>{Math.round(currentPosition(racer))}<em>格</em></>}</b></span>; })}</div>}
  </aside>;
}

function PredictionHud({ room, racers, choosing, onDetail }: { room: RoomView; racers: Racer[]; choosing: boolean; onDetail:Props['onDetail'] }) {
  if (room.phase !== 'race') return null;
  // These are displayed racers, never the newer confirmed room's future flags.
  const predictions = racers.flatMap(source => { const target = racers.find(racer => racer.id === source.flags.prediction); return target ? [{ source, target }] : []; });
  if (!predictions.length) return null;
  const ownerText = (racer: Racer) => { const owner = room.players.find(player => player.id === racer.playerId); return `${(owner?.seat ?? 0) + 1}号 · ${owner?.id === room.selfId ? '你' : owner?.name ?? '选手'}`; };
  return <aside className={`prediction-hud ${choosing ? 'is-choosing' : ''}`} data-testid="prediction-hud" aria-label="本场冠军预测" aria-live="polite"><span className="prediction-hud-title" title="冠军预测"><Icon kind="trophy" size={17} /><span className="sr-only">冠军预测</span></span><div className="prediction-hud-list">{predictions.map(({ source, target }) => <div key={source.id} className={`prediction-chip ${source.eliminated ? 'is-inactive' : ''}`} data-prediction-source={source.id} data-prediction-target={target.id} aria-label={`${ownerText(source)}的${characterName(source.characterId)}预测${ownerText(target)}的${characterName(target.characterId)}夺冠${source.eliminated ? '，预测已失效' : ''}`}>
    <button type="button" className="prediction-avatar board-avatar-button" onClick={() => onDetail(source.characterId, source.id)} aria-label={`查看${characterName(source.characterId)}技能与当前玩家`}><Avatar id={source.characterId} /><b>{(room.players.find(player => player.id === source.playerId)?.seat ?? 0) + 1}</b></button><Icon kind="arrow" size={16} /><button type="button" className="prediction-avatar board-avatar-button" onClick={() => onDetail(target.characterId, target.id)} aria-label={`查看预测目标${characterName(target.characterId)}技能与当前玩家`} title={characterName(target.characterId)}><Avatar id={target.characterId} /><b>{(room.players.find(player => player.id === target.playerId)?.seat ?? 0) + 1}</b></button>{source.eliminated && <em>已失效</em>}
  </div>)}</div></aside>;
}

function Pawn({ actorBounds,physicalContacts,certified,trip,sculptureReaders,punch,paused, clock, racer, racers, room, compact, beat, startedAt, durationMs, lowQuality, reducedMotion, active, onDetail, labels }: { actorBounds:MechanismActorBounds;physicalContacts:boolean;certified:CertifiedTripController;trip:TripController;sculptureReaders:React.RefObject<Map<string,()=>boolean>>;punch:PunchController;paused: boolean; clock: PresentationClock; racer: Racer; racers: Racer[]; room: RoomView; compact: boolean; beat?: PresentationBeat; startedAt: number; durationMs: number; lowQuality: boolean; reducedMotion: boolean; active: boolean; onDetail: (id: string, racerId?: string) => void; labels: React.RefObject<Map<string, HTMLSpanElement>> }) {
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null);
  const protectedGeometry=certified.geometry(racer.id);
  // Keep the audited sculpture geometry through its supported down/recover pose.
  // Quality changes still apply to the rest of the scene.
  const modelQuality=protectedGeometry?.lowQuality??lowQuality;
  const certifiedBind=physicalContacts&&(certifiedTripMount(room.track,racer.position)||needsCertifiedBind(room.track,racer,beat,lowQuality)||certified.protects(racer.id));
  const captureKey=useRef('');
  const captureGeneration=useRef(0);
  useEffect(()=>{captureKey.current='';captureGeneration.current++;return()=>{captureGeneration.current++;captureKey.current='';certified.actors.delete(racer.id);};},[certified,racer.id]);
  useFrame(()=>{if(!body.current||!certifiedBind)return;const ids:string[]=[];body.current.traverse(n=>ids.push(n.uuid));const key=JSON.stringify([certifiedBind,modelQuality,racer.flags,ids]);if(key===captureKey.current)return;captureKey.current=key;certified.actors.delete(racer.id);if(!certifiedBind)return;const snapshot=captureActorGeometry(body.current);if(!snapshot||snapshot.requiresSkeletonFreeze)return;const current=key,generation=captureGeneration.current;void actorGeometryFingerprint(snapshot).then(hash=>{if(captureGeneration.current===generation&&captureKey.current===current){if(certifiedBind)certified.acceptActor(racer.id,hash,snapshot.vertices);invalidate();}}).catch(()=>{});},-2);
  useEffect(()=>body.current?actorBounds.bind(racer.id,body.current):undefined,[actorBounds,racer.id]);
  const opacity=useMemo(()=>new PawnOpacity(),[]);useEffect(()=>()=>opacity.restore(),[opacity]);
  useEffect(()=>{const key=`${racer.id}:${lowQuality}`;const read=()=>{let ready=false;root.current?.traverse(object=>{if(object.userData.racerMainSculpture){const sculpture=object.children.find(child=>child.userData.sculptureState);ready=!!sculpture?.visible&&sculpture.userData.sculptureState==='ready';}});return ready;};sculptureReaders.current.set(key,read);return()=>{if(sculptureReaders.current.get(key)===read)sculptureReaders.current.delete(key);};},[racer.id,lowQuality,sculptureReaders]);
  const { camera, size, invalidate } = useThree(); const projection = useMemo(() => new THREE.Vector3(), []);
  const owner = room.players.find(p => p.id === racer.playerId);
  const color = owner?.color ?? '#ffcf50';
  const motion = beat?.motions.find(m => m.racerId === racer.id);
  const warpMode=mechanismsEnabled()?warpTransitionMode(beat,racers):'ordinary';
  const warpBind=warpMode==='single-resident-reflow'&&!!beat?.motions.some(m=>m.from===racer.position||m.to===racer.position);
  const from = boardPoint(motion?.from ?? racer.position, compact, room.track);
  const offset = occupancy(racer, racers, motion?.from ?? racer.position, compact, room.track);
  const destinations = motion ? racers.map(r => ({ ...r, position: beat?.motions.find(m => m.racerId === r.id)?.to ?? r.position })) : racers;
  const endOffset = occupancy(racer, destinations, motion?.to ?? racer.position, compact, room.track);
  const route = useMemo(() => motion ? pawnRoute(motion.path.map((position, index) => {
    const point = boardPoint(position, compact, room.track);
    return [point[0] + (index === 0 ? offset.x : index === motion.path.length - 1 ? endOffset.x : 0), point[1], point[2] + (index === 0 ? offset.z : index === motion.path.length - 1 ? endOffset.z : 0)];
  }), room.track === 'bridges' || beat?.cause === 'track-arrow') : undefined, [motion, compact, room.track, beat?.cause, offset.x, offset.z, endOffset.x, endOffset.z]);
  const walkPoint = useMemo(() => new THREE.Vector3(), []);
  const affected = beat?.targets.includes(racer.id) || beat?.source === racer.id;
  const mechanismTarget=mechanismsEnabled()&&mechanismActions(room.track,beat,racers).some(a=>a.targets.includes(racer.id));
  const displayTrip=environmentEnabled()&&mechanismsEnabled()&&mechanismActions(room.track,beat,racers).some(a=>a.anchor.kind==='trip'&&a.targets.includes(racer.id));
  const punchWind=environmentEnabled()&&mechanismsEnabled()&&mechanismActions(room.track,beat,racers).some(a=>a.anchor.kind==='punch'&&a.targets.includes(racer.id));
  const toyPresentation=!physicalContacts&&mechanismTarget&&!reducedMotion&&beat?{key:beat.key,clock,startedAt,durationMs,movementProgress:(t:number)=>punch.route(t,racer.id)??(punchWind?punchWindRoute(t):strideProgress(t)),movementCycles:Math.max(1,motion?motion.path.length-1:1)}:undefined;
  const Character=toyPresentation?MechanismToyCharacter:ToyCharacter;
  useFrame(() => {
    if (!root.current || !body.current) return;
    // Demand rendering in reduced-motion mode must show the confirmed endpoint
    // immediately; it cannot rely on another animation frame to reach it.
    const t = trip.involves(racer.id)?trip.progress:beat && !reducedMotion ? progress(startedAt, durationMs, clock) : 1;
    let x = from[0] + offset.x, z = from[2] + offset.z, y = from[1] + .005, scale = offset.scale, tilt = racer.tripped ? -Math.PI / 2 : 0, swing = 0;
    if (motion) {
      const target = boardPoint(motion.to, compact, room.track);
      if (beat?.kind === 'swap' && !reducedMotion) {
        const fraction = ease(t), dx = target[0] - from[0], dz = target[2] - from[2], length = Math.max(1, Math.hypot(dx, dz));
        x = THREE.MathUtils.lerp(from[0] + offset.x, target[0] + endOffset.x, fraction) - dz / length * Math.sin(t * Math.PI) * .55;
        z = THREE.MathUtils.lerp(from[2] + offset.z, target[2] + endOffset.z, fraction) + dx / length * Math.sin(t * Math.PI) * .55;
        y = THREE.MathUtils.lerp(from[1], target[1], fraction) + .005 + Math.sin(t * Math.PI) * .6; scale = THREE.MathUtils.lerp(offset.scale, endOffset.scale, fraction); swing = Math.sin(t * Math.PI) * .25;
      } else if (beat?.kind === 'warp' || beat?.kind === 'swap') {
        const arrived = t > .5,fullSizeWarp=mechanismsEnabled()&&beat?.kind==='warp'&&beat.cause==='track-whirl'; x = (arrived ? target[0] + endOffset.x : x); z = (arrived ? target[2] + endOffset.z : z);
        y = (arrived ? target[1] : from[1]) + .005; scale = (arrived ? endOffset.scale : offset.scale) * (fullSizeWarp?1:Math.max(.04, Math.abs(2 * t - 1))); y += reducedMotion||fullSizeWarp ? 0 : Math.sin(t * Math.PI) * .65; swing = reducedMotion||fullSizeWarp ? 0 : t * Math.PI * 2;
      } else {
        const count = Math.max(1, motion.path.length - 1), fraction = punch.route(t,racer.id)??(punchWind?punchWindRoute(t):strideProgress(t)), walk = fraction * count;
        route!.getPointAt(fraction, walkPoint);x=walkPoint.x;z=walkPoint.z;y=walkPoint.y+.005+(reducedMotion?0:strideLift(fraction,count));
        const backwards = trackMovementDistance(room.track, motion.path, room.trackState?.reversed) < 0;
        swing = reducedMotion||punch.protects(racer.id)||certified.protects(racer.id) ? 0 : Math.sin(walk * Math.PI * 2) * (backwards ? -.055 : .045); scale = THREE.MathUtils.lerp(offset.scale, endOffset.scale, fraction);
      }
    }
    if(warpMode==='single-resident-reflow'){const reflow=warpResidentLayout(room.track,compact,beat,racer,racers,t);if(reflow){x=from[0]+reflow.x;z=from[2]+reflow.z;scale=reflow.scale;}}
    const fallPhase = pawnFallPhase(beat, racer);
    if(trip.plan?.kind==='entry'&&trip.plan.oldId===racer.id){const reflow=residentReflow(trip.progress);x=from[0]+reflow.x;scale=reflow.scale;}
    const fall = fallPhase ? pawnFallPose(trip.plan?.kind==='trip'&&trip.involves(racer.id)?trip.progress:displayTrip?displayTripFallProgress(t,actorBounds.tripHit(beat?.key??'',racer.id)):t, fallPhase, reducedMotion) : undefined;
    if (fall) { tilt = fall.tilt; swing = 0; }
    if (affected && beat?.kind === 'skill' && !reducedMotion && !punch.protects(racer.id) && !trip.protects(racer.id) && !certified.protects(racer.id)) { y += Math.sin(t * Math.PI) * .3; swing += Math.sin(t * Math.PI * 2) * .18; }
    if (beat?.targets.includes(racer.id) && beat.kind === 'eliminate') scale *= 1 - ease(t);
    root.current.position.set(x, y, z); root.current.scale.setScalar(Math.max(.01, scale)); body.current.rotation.set(tilt, swing+(compact&&punch.protects(racer.id)?-Math.PI/2:0), 0); body.current.position.y = fall?.lift ?? 0;
    const certifiedFall=certified.fall(racer.id,beat,t);if(certifiedFall){body.current.quaternion.copy(certifiedFall.quaternion);body.current.position.y=certifiedFall.lift;}
    const fading=!!motion&&mechanismsEnabled()&&beat?.kind==='warp'&&beat.cause==='track-whirl'&&warpNeedsOpacity(warpMode,reducedMotion);
    if(fading)opacity.apply(root.current,warpTransitionOpacity(warpMode,t));else opacity.restore();
    const label = labels.current.get(racer.id);
    if(label)label.style.opacity=fading?String(warpTransitionOpacity(warpMode,t)):'';
    if (label) { label.dataset.warpMode=warpMode;label.dataset.modelReady=String(sculptureReaders.current.get(`${racer.id}:${lowQuality}`)?.()===true);label.dataset.worldX = x.toFixed(4); label.dataset.worldY = y.toFixed(4); label.dataset.worldZ = z.toFixed(4); }
    if (label) { root.current.updateWorldMatrix(true, false); projection.set(0, .19, .34).applyMatrix4(root.current.matrixWorld).project(camera); label.style.transform = `translate(${(projection.x + 1) * size.width / 2}px,${(1 - projection.y) * size.height / 2}px) translate(-50%,-50%)`; label.style.visibility = projection.z < -1 || projection.z > 1 ? 'hidden' : 'visible'; }
  });
  return <group ref={root} position={[from[0] + offset.x, from[1] + .005, from[2] + offset.z]} scale={offset.scale} onClick={e => { e.stopPropagation(); if (e.delta <= 5) onDetail(racer.characterId, racer.id); }}>
    <PawnContact />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .018, 0]}><ringGeometry args={[.31, active ? .43 : .38, 24]} /><meshBasicMaterial color={active ? '#ffda27' : color} side={THREE.DoubleSide} /></mesh>
    <group ref={body} position={[0, 0, 0]}><Character {...(toyPresentation?{presentation:toyPresentation}:{})} paused={paused} characterId={racer.characterId} color={color} lowQuality={modelQuality} form={typeof racer.flags.form === 'string' ? racer.flags.form : undefined} mount={typeof racer.flags.hogOwnerId === 'string'} motionEnabled={!displayTrip&&!certifiedBind&&!warpBind&&!trip.protects(racer.id)&&!punch.protects(racer.id)&&!reducedMotion && (!racer.tripped || pawnFallPhase(beat, racer) === 'recover')} animation={affected ? pawnFallPhase(beat, racer) === 'trip' ? 'fall' : pawnFallPhase(beat, racer) === 'recover' ? 'recover' : beat?.kind === 'move' ? 'move' : ['skill','dice','duel-dice','score','finish'].includes(beat?.kind ?? '') ? 'skill' : 'idle' : 'idle'} /></group>
    {active && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .023, 0]}><ringGeometry args={[.46, .49, 32]} /><meshBasicMaterial color="#fff8da" side={THREE.DoubleSide} /></mesh>}
  </group>;
}

function ScoreProjector({ track, beat, racers, compact, label }: { beat?: PresentationBeat; racers: Racer[]; compact: boolean; track: TrackId; label: React.RefObject<HTMLSpanElement | null> }) {
  const { camera, size } = useThree(); const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => { const racer = racers.find(r => r.id === beat?.source); if (!label.current || !racer || !beat || !['score', 'finish'].includes(beat.kind)) return; const point = pawnWorldPoint(racer, racers, racer.position, compact, track); projected.set(point[0], point[1] + 2.28, point[2]).project(camera); label.current.style.transform = `translate(${(projected.x + 1) * size.width / 2}px,${(1 - projected.y) * size.height / 2}px) translate(-50%,-50%)`; });
  return null;
}

function useDiceSound(beat: PresentationBeat | undefined, startedAt: number, durationMs: number, muted: boolean, paused: boolean, clock: PresentationClock) {
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => { const unlock = () => { if (muted) return; try { audio.current ??= new AudioContext(); void audio.current.resume(); } catch { /* Audio is optional. */ } }; document.addEventListener('pointerdown', unlock); return () => document.removeEventListener('pointerdown', unlock); }, [muted]);
  useEffect(() => {
    if (paused || muted || !beat || beat.kind !== 'dice' && beat.kind !== 'duel-dice') return;
    const elapsed = clock.now() - startedAt;
    const timers = [.34, .59, .75, .83].flatMap((at, index) => durationMs * at < elapsed ? [] : [setTimeout(() => {
      if (clock.paused) return;
      try { const ctx = audio.current; if (!ctx || ctx.state !== 'running') return; const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(170 + index * 35, ctx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + .065); gain.gain.setValueAtTime(.13 / (index + 1), ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .09); oscillator.connect(gain).connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + .1); } catch { /* Gameplay never depends on audio availability. */ }
    }, Math.max(0, durationMs * at - elapsed))]);
    return () => timers.forEach(clearTimeout);
  }, [beat?.key, startedAt, durationMs, muted, paused, clock]);
  useEffect(() => () => { void audio.current?.close(); }, []);
}

function scoreCaption(beat?: PresentationBeat) {
  const event = beat?.events.find(event => event.type === 'score');
  const delta = event && eventScoreDelta(event);
  return delta !== undefined ? `${delta >= 0 ? '+' : ''}${delta}分` : undefined;
}
