import type {RoomView} from '../../../shared/types.js';
/** Prepared hardware belongs to one live match, not a reusable room code or
 * event number. Content restoration and backend switches invalidate history. */
export function mechanismScope(room:RoomView){return JSON.stringify([room.backendId??'',room.code,room.createdAt??'',room.contentRevision??0,room.round,room.track,room.racers.map(r=>r.id)]);}
