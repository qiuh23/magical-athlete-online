import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Racer, RoomView } from '../shared/types.js';
import { PresentationClock } from './presentation-clock.js';
import { beatCompletionTime, beatDuration, completeBeat, createPlayback, diceResultReadMs, receiveRoom, skipPlayback, presentedTrackState, type PlaybackState, type PresentationBeat, type PresentationOptions } from './presentation.js';

export interface UsePresentationResult {
  clock: PresentationClock;
  paused: boolean;
  state: PlaybackState | null;
  beat: PresentationBeat | undefined;
  racers: Racer[];
  playing: boolean;
  skip: () => void;
  startedAt: number;
  durationMs: number;
  displayRoom: RoomView | null;
  startIntro: (key:string) => void;
  introReady: boolean;
  onDiceSettled: (key:string) => void;
}

/** A visual clock only. Its timers never advance the rule engine or room service. */
export function usePresentation(room: RoomView | null, options: PresentationOptions & { reconnect?: boolean } = {}): UsePresentationResult {
  const [clock] = useState(() => new PresentationClock());
  const paused = !!room?.pause;
  clock.setPaused(paused);
  const [state, setState] = useState<PlaybackState | null>(() => room ? createPlayback(room) : null);
  const latestRoom = useRef(room);
  latestRoom.current = room;
  const previousRoom = useRef(room);
  const recovering = useRef(false);
  useEffect(() => {
    const changed = previousRoom.current !== room;
    previousRoom.current = room;
    if (options.reconnect) recovering.current = true;
    const reconnect = !!options.reconnect || (recovering.current && changed);
    if (!options.reconnect && changed) recovering.current = false;
    setState(previous => !room ? null : !previous ? createPlayback(room) : receiveRoom(previous, room, { reconnect }));
  }, [room, options.reconnect]);
  const beat = state?.queue[0];
  const [introReadyKey, setIntroReadyKey] = useState<string>();
  const startIntro = useCallback((key:string)=>setIntroReadyKey(key),[]);
  const introReady = beat?.kind !== 'intro' || introReadyKey === beat.key;
  const durationMs = beat ? beatDuration(beat, options) : 0;
  const [diceSettled,setDiceSettled]=useState<{key:string;at:number}>();
  const activeDiceKey=useRef<string|undefined>(undefined);
  activeDiceKey.current=diceResultReadMs(beat)?beat?.key:undefined;
  const onDiceSettled=useCallback((key:string)=>{
    if(clock.paused||activeDiceKey.current!==key)return;
    setDiceSettled(previous=>previous?.key===key?previous:{key,at:clock.now()});
  },[clock]);
  useEffect(()=>{setDiceSettled(previous=>previous?.key===beat?.key?previous:undefined);},[beat?.key]);
  const diceSettledAt=diceSettled?.key===beat?.key?diceSettled?.at:undefined;
  // Bind the visible clock to the beat in the same render. An effect-set clock
  // lets a new die/pawn render once with the preceding beat's completed time.
  const startedAt = useMemo(() => clock.now(), [clock,beat?.key,beat?.kind==='intro'?introReadyKey:undefined]);
  useEffect(() => {
    if (!beat || !introReady || paused) return;
    const completeAt=beatCompletionTime(beat,startedAt,durationMs,diceSettledAt);
    if(completeAt===undefined)return;
    const timer = setTimeout(() => { if (!clock.paused) setState(previous => previous?.queue[0]?.key === beat.key ? completeBeat(previous) : previous); }, Math.max(0, completeAt-clock.now()));
    return () => clearTimeout(timer);
  }, [beat?.key, durationMs, startedAt, introReady, diceSettledAt, paused, clock]);
  const skip = useCallback(() => {if(clock.paused)return;activeDiceKey.current=undefined;setDiceSettled(undefined);setState(previous => previous?.queue[0]?.kind === 'intro' ? completeBeat(previous) : previous && latestRoom.current ? skipPlayback(previous, latestRoom.current) : previous);}, [clock]);
  // While a completed action is still being shown, the action prompt must wait.
  const displayRoom: RoomView | null = state ? { ...state.confirmed, players: state.confirmed.players.map(player => ({...player, name: room?.players.find(current => current.id === player.id)?.name ?? player.name})), spectators: room?.spectators ?? state.confirmed.spectators, racers: state.racers, ...(state.queue.length && ['results', 'finished'].includes(state.confirmed.phase) ? { phase: 'race' as const } : {}) } : room;
  if(displayRoom&&state)displayRoom.trackState=presentedTrackState(state.confirmed,state.queue);
  return { clock, paused, state, beat, racers: state?.racers ?? room?.racers ?? [], playing: (state?.queue.length ?? 0) > 0, skip, startedAt, durationMs, displayRoom, startIntro, introReady, onDiceSettled };
}
