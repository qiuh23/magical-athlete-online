import { IS_CN_SITE } from './site-edition.js';
import type { ChatMessage } from '../shared/types.js';

export interface CommunityState { messages: ChatMessage[]; latestId: number; connected: boolean; renameRemaining?: number; name?: string; liveRevision?: number; liveMessages?: ChatMessage[];contentRevision?:number; }
/** Community updates have their own sequence and never advance gameplay. */
export class CommunityFeed {
  private state: CommunityState = { messages: [], latestId: 0, connected: false };
  private listeners = new Set<(state: CommunityState) => void>();
  private hydrated = false;
  subscribe = (listener: (state: CommunityState) => void) => {
    this.listeners.add(listener); listener(this.state);
    return () => { this.listeners.delete(listener); };
  };
  update(change: Partial<CommunityState>, source: 'update' | 'history' | 'live' = 'update') {
    if(IS_CN_SITE){this.state={messages:[],latestId:0,connected:change.connected??this.state.connected};for(const listener of this.listeners)listener(this.state);return;}
    if(change.contentRevision!==undefined&&change.contentRevision<(this.state.contentRevision??0))return;
    if((this.state.contentRevision??0)>0&&change.contentRevision===undefined){change={...change};delete change.name;delete change.renameRemaining;}
    // The transport explicitly marks hydration. A reconnect backlog must never
    // become a toast, even when its IDs are newer than the cached history.
    if(change.connected===false)this.hydrated=false;
    const fresh=source==='live'&&this.hydrated&&this.state.connected?(change.messages??[]).filter(message=>message.id>this.state.latestId):[];
    if(source==='history'&&change.messages)this.hydrated=true;
    const hidden=new Set([...this.state.messages,...(change.messages??[])].filter(message=>message.hidden).map(message=>message.id));
    const updates=new Map([...this.state.messages,...(change.messages??[])].map(message=>[message.id,message]));
    for(const id of hidden){const tombstone=(change.messages??[]).find(message=>message.id===id&&message.hidden)??this.state.messages.find(message=>message.id===id&&message.hidden);if(tombstone)updates.set(id,tombstone);}
    for(const message of this.state.messages)if(message.moderated&&!updates.get(message.id)?.moderated&&!updates.get(message.id)?.hidden)updates.set(message.id,message);
    const messages = change.messages ? [...updates.values()].sort((a,b)=>a.id-b.id).slice(-100) : this.state.messages;
    this.state = { ...this.state, ...change, messages, latestId: Math.max(this.state.latestId, change.latestId ?? 0, messages.at(-1)?.id ?? 0) };
    // Keep a bounded live tail so React batching cannot drop the first messages
    // of a burst before the collapsed panel gets its next render.
    if(fresh.length)this.state={...this.state,liveRevision:(this.state.liveRevision??0)+1,liveMessages:[...(this.state.liveMessages??[]),...fresh].slice(-100)};
    if(change.connected===false)this.state={...this.state,liveMessages:[]};
    // Same-ID administrative replacements must invalidate cached live bubbles,
    // including if an older acknowledgement arrives after the tombstone.
    this.state={...this.state,liveMessages:this.state.liveMessages?.filter(message=>!hidden.has(message.id)).map(message=>updates.get(message.id)??message)};
    for (const listener of this.listeners) listener(this.state);
  }
}
