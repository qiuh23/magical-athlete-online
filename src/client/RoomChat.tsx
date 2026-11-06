import { useRaceHudGeometry } from './useRaceHudGeometry.js';
import { randomId } from './random-id.js';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { RoomView } from '../shared/types.js';
import type { RoomConnection } from './network.js';
import type { CommunityState } from './community.js';
import { CHAT_NOTICE_CONFIG, ChatNoticeBubble, advanceChatNotices, appendChatNotices, type ChatNotice } from './chat-notices.js';
import { STATIONMASTER_CONTACT } from '../shared/security.js';
import { Icon } from './Icons.js';

export function RoomChat({ room, community, connection, immersive, onRename }: { room: RoomView; community: CommunityState; connection: RoomConnection | null; immersive: boolean; onRename: () => void }) {
  const [open, setOpen] = useState(false), [text, setText] = useState(''), [sending, setSending] = useState(false), [error, setError] = useState('');
  const readKey = `magical-athlete:chat-read:${room.backendId ?? 'cloudflare'}:${room.code}`;
  const [seen, setSeen] = useState(() => { try { return Number(sessionStorage.getItem(readKey)) || community.latestId; } catch { return community.latestId; } });
  const [newBelow, setNewBelow] = useState(false);
  const minimapBottom=useRaceHudGeometry(immersive,room.round);
  const [notices,setNotices]=useState<ChatNotice[]>([]);
  const [noticeLimit,setNoticeLimit]=useState(() => matchMedia(`(max-width:${CHAT_NOTICE_CONFIG.mobileBreakpoint}px)`).matches ? CHAT_NOTICE_CONFIG.mobileLimit : CHAT_NOTICE_CONFIG.desktopLimit);
  const noticeRegion=useRef<HTMLDivElement>(null),noticeRects=useRef(new Map<string,DOMRect>());
  const portal = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null), wasOpen = useRef(false);
  const noticed=useRef(community.liveRevision??0);
  const noticedMessage=useRef(community.liveMessages?.at(-1)?.id??0);
  const list = useRef<HTMLDivElement>(null), bottom = useRef(true), initial = useRef(true);
  const retry = useRef<{ text: string; clientMessageId: string } | null>(null);
  const unread = community.messages.filter(message => message.id > seen && message.senderId !== room.selfId).length;
  const markRead = () => { setSeen(community.latestId); try { sessionStorage.setItem(readKey, String(community.latestId)); } catch { /* Optional read marker. */ } };
  const scrollBottom = () => { if (list.current) list.current.scrollTop = list.current.scrollHeight; bottom.current = true; setNewBelow(false); markRead(); };
  useEffect(() => { if (!open && wasOpen.current) toggle.current?.focus(); wasOpen.current = open; }, [open]);
  useLayoutEffect(() => {
    if (!immersive || !portal.current) return;
    // Bottom sheets and live notices reserve their own space. Choices never
    // participate in this measurement, so resizing a choice cannot move chat.
    const update = () => document.documentElement.style.setProperty('--race-chat-height', `${Math.ceil(portal.current!.getBoundingClientRect().height)}px`);
    const observer = new ResizeObserver(update); observer.observe(portal.current); update();
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--race-chat-height'); };
  }, [immersive, open, notices.length]);
  useEffect(()=>{
    const revision=community.liveRevision??0;
    if(open||!community.connected)setNotices([]);
    else if(revision>noticed.current){const fresh=(community.liveMessages??[]).filter(message=>message.id>noticedMessage.current);setNotices(previous=>appendChatNotices(previous,fresh,room.selfId,Date.now(),noticeLimit));}
    noticed.current=revision;
    noticedMessage.current=community.liveMessages?.at(-1)?.id??noticedMessage.current;
  },[community.liveRevision,community.connected,open,room.selfId,noticeLimit]);
  useEffect(()=>{
    if(!notices.length)return;
    const next=Math.min(...notices.map(notice=>notice.expiresAt+(notice.leaving?CHAT_NOTICE_CONFIG.exitMs:0)));
    const timer=setTimeout(()=>setNotices(current=>advanceChatNotices(current,Date.now(),noticeLimit)),Math.max(0,next-Date.now()));
    return ()=>clearTimeout(timer);
  },[notices,noticeLimit]);
  useEffect(()=>{
    const media=matchMedia(`(max-width:${CHAT_NOTICE_CONFIG.mobileBreakpoint}px)`);
    const resize=()=>{const limit=media.matches?CHAT_NOTICE_CONFIG.mobileLimit:CHAT_NOTICE_CONFIG.desktopLimit;setNoticeLimit(limit);setNotices(current=>advanceChatNotices(current,Date.now(),limit));};
    media.addEventListener('change',resize);return()=>media.removeEventListener('change',resize);
  },[]);
  useLayoutEffect(()=>{
    const next=new Map<string,DOMRect>();
    for(const element of noticeRegion.current?.querySelectorAll<HTMLElement>('[data-message-id]')??[]){
      const id=element.dataset.messageId!,rect=element.getBoundingClientRect(),before=noticeRects.current.get(id);next.set(id,rect);
      if(before && before.top!==rect.top && !element.classList.contains('is-leaving') && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion!=='reduce'){
        for(const animation of element.getAnimations())animation.cancel();
        element.animate([{transform:`translateY(${before.top-rect.top}px)`},{transform:'translateY(0)'}],{duration:CHAT_NOTICE_CONFIG.stackMs,easing:'ease-out'});
      }
    }
    noticeRects.current=next;
  },[notices]);
  useLayoutEffect(() => {
    if (!open) return;
    if (initial.current || bottom.current) { scrollBottom(); initial.current = false; }
    else setNewBelow(community.latestId > seen);
  }, [open, community.latestId]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const height=viewport?.height??innerHeight,offset=Math.max(0,innerHeight-height-(viewport?.offsetTop??0));
      document.documentElement.style.setProperty('--chat-keyboard-offset',`${offset}px`);
      document.documentElement.style.setProperty('--chat-viewport-height',`${height}px`);
      document.documentElement.dataset.chatKeyboard=String(offset>80);
      document.documentElement.dataset.chatCompact=String(offset>80&&height<480);
    };
    viewport?.addEventListener('resize', update); viewport?.addEventListener('scroll',update); window.addEventListener('resize',update); update();
    return () => { viewport?.removeEventListener('resize', update); viewport?.removeEventListener('scroll',update); window.removeEventListener('resize',update); document.documentElement.style.removeProperty('--chat-keyboard-offset'); document.documentElement.style.removeProperty('--chat-viewport-height');delete document.documentElement.dataset.chatKeyboard;delete document.documentElement.dataset.chatCompact; };
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !portal.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending || !connection?.sendChat) return;
    if (value.length > 500) { setError('消息最多 500 个字符。'); return; }
    setSending(true); setError('');
    const request = retry.current?.text === value ? retry.current : { text: value, clientMessageId: randomId() };
    retry.current = request;
    try {
      const reply = await connection.sendChat(request);
      if (!reply.ok) { setError(reply.error ?? '发送失败，请重试。'); return; }
      retry.current = null; setText(''); bottom.current = true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : '尚未确认发送，请重试。'); }
    finally { setSending(false); }
  };
  // A viewport overlay must not inherit any ancestor's transform/containment:
  // those turn fixed coordinates into page-local coordinates during scenes.
  return createPortal(<aside ref={portal} className={`room-community ${immersive ? 'in-race' : ''} ${open ? 'is-open' : ''}`} style={{'--chat-minimap-bottom':`${minimapBottom}px`} as CSSProperties} data-testid="room-community" onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') setOpen(false); }}>
    {!open&&notices.length>0&&<div ref={noticeRegion} className="chat-notice-region" aria-live="polite" aria-relevant="additions" aria-label="新聊天消息">{notices.filter(notice=>!community.messages.find(message=>message.id===notice.message.id)?.hidden).map(notice=>{const current=community.messages.find(message=>message.id===notice.message.id);return <ChatNoticeBubble key={notice.message.id} notice={current?{...notice,message:current}:notice} onOpen={()=>setOpen(true)} />;})}</div>}
    {!open && <button ref={toggle} type="button" className="chat-toggle" title="房间聊天" aria-label={`房间聊天${unread ? `，${unread} 条未读` : ''}`} aria-expanded={false} aria-controls="room-chat-panel" onClick={() => setOpen(true)}><Icon kind="chat" size={25} />{unread > 0 && <b className="chat-unread" aria-hidden="true">{unread > 99 ? '99+' : unread}</b>}</button>}
    {open && <section className="room-chat" id="room-chat-panel" aria-label="房间聊天" data-testid="room-chat">
      <header><div><strong>房间聊天</strong><small>{community.connected ? '在线' : '连接中…'}</small></div><button type="button" aria-label="收起聊天" onClick={() => setOpen(false)}><Icon kind="close" /></button></header>
      <details className="chat-report"><summary>举报 / 联系站长</summary><p><a href={`mailto:${STATIONMASTER_CONTACT}?subject=${encodeURIComponent('运动会举报 '+(room.backendId??'cloudflare')+' '+room.code)}`}>举报 / 联系站长</a> · 请提供服务器、房间码、消息编号和原因，勿发送密码或令牌。</p></details>
      <div className="chat-personal"><span>{community.name ?? room.players.find(player => player.id === room.selfId)?.name ?? room.spectators?.find(viewer => viewer.id === room.selfId)?.name}</span>{room.role !== 'spectator' && <button disabled={room.phase === 'lobby'} title={room.phase === 'lobby' ? '开局后可修改一次昵称' : undefined} onClick={onRename}>修改昵称 · {community.renameRemaining ?? room.renameRemaining ?? 1} 次</button>}</div>
      <div className="chat-messages" ref={list} role="log" aria-label="聊天记录" aria-live="polite" aria-relevant="additions" onScroll={() => { const el = list.current; bottom.current = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 36; if (bottom.current) { setNewBelow(false); markRead(); } }}>
        {community.messages.length === 0 && <p className="chat-empty">暂无消息</p>}
        {community.messages.map(message => <article key={message.id} className={`chat-message ${message.kind === 'system' ? 'is-system' : ''} ${message.senderId === room.selfId ? 'is-self' : ''}`} data-message-id={message.id}>
          <div><strong>{message.kind === 'system' ? '系统' : message.senderName}</strong><time dateTime={new Date(message.sentAt).toISOString()}>{new Date(message.sentAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · #{message.id}</time></div><p>{message.text}</p>
        </article>)}
      </div>
      {newBelow && <button className="chat-new" onClick={scrollBottom}>查看新消息 ↓</button>}
      {error && <p className="chat-error" role="alert">{error}</p>}
      <form onSubmit={send}><label className="sr-only" htmlFor="room-chat-input">聊天消息</label><textarea id="room-chat-input" rows={1} maxLength={500} value={text} onChange={event => setText(event.target.value)} placeholder="说点什么…" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button disabled={sending || !community.connected || !text.trim()}>{sending ? '发送中' : '发送'}</button></form>
    </section>}
  </aside>,document.body);
}

export function RenameForm({ room, community, connection, onSuccess }: { room: RoomView; community: CommunityState; connection: RoomConnection | null; onSuccess: (name: string) => void }) {
  const current = community.name ?? room.players.find(player => player.id === room.selfId)?.name ?? '';
  const [name, setName] = useState(current), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const request = useRef<{ requestId: string; name: string } | null>(null);
  const remaining = community.renameRemaining ?? room.renameRemaining ?? 1;
  return <form className="rename-form" data-unsaved={name !== current} data-submitting={busy} onSubmit={async event => {
    event.preventDefault(); if (busy || !remaining || !connection?.rename) return;
    setBusy(true); setError('');
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) { setError('昵称需要 1～20 个字符。'); setBusy(false); return; }
    if (request.current?.name !== trimmed) request.current = { requestId: randomId(), name: trimmed };
    try { const reply = await connection.rename(request.current!); if (reply.ok && reply.name) onSuccess(reply.name); else { setError(reply.error ?? '修改未成功，请重试。'); request.current = null; } }
    catch (cause) { setError(cause instanceof Error ? cause.message : '尚未确认修改，请重试。'); }
    finally { setBusy(false); }
  }}><p>当前昵称：<strong>{current}</strong></p><p>{remaining ? '每局完整对局可修改一次，全部场次共用。重名时自动追加最小可用数字。' : '本局已修改过昵称'}</p><label>新昵称<input autoComplete="nickname" autoFocus maxLength={20} disabled={!remaining || busy} value={name} onChange={event => setName(event.target.value)} /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="button" disabled={!remaining || busy || !name.trim() || name.trim() === current}>{busy ? '修改中…' : '确认修改昵称'}</button></form>;
}
