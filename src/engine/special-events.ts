import { CHARACTERS } from '../shared/characters.js';
import { THIRD_EVENTS, type ThirdEventId } from '../shared/special-events.js';
import { TRACKS } from '../shared/tracks.js';
import { nextTrackNodes } from '../shared/track-topology.js';
import { sharing } from '../shared/race-track.js';
import type { GameState, PendingChoice, Racer, Task } from '../shared/types.js';
import type { TwistContext } from './twist-cards.js';

type Work=Task&Record<string,any>;
type Guesses={actor:string;participants:string[];values:Record<string,number>;target?:string;secret?:number;face?:number};
export interface ThirdsState {
  id:ThirdEventId; round:number; held:Record<string,string>; extraCards:string[];
  npc?:{id:string;position:number;finished?:boolean}; trampolines?:number[];
  direction?:number; acted?:string[]; finishOrder?:string[]; settling?:boolean;
  guesses?:Guesses; pendingAwards?:{actor:string;beneficiaries:string[];distance:number;points:boolean};
  newStart?:number;
}
export interface ThirdsContext extends TwistContext {
  eventPoints:(s:GameState,r:Racer,amount:number,cause:string)=>void;
  acquirePower:(r:Racer,power:string,source?:{sourceCardId?:string;via?:string})=>void;
  rollOff:(s:GameState,ids:string[])=>string;
}
export function installThirds(ctx:ThirdsContext){
  const {name,live,racer,active,owner,order,ask,push,log}=ctx;
  const state=(s:GameState)=>s.flags.thirds as ThirdsState|undefined;
  const event=(s:GameState,id:ThirdEventId)=>state(s)?.id===id;
  const work=(step:string,more:Record<string,any>={}):Work=>({kind:'thirds',step,...more});
  const label=(id:string)=>CHARACTERS.find(c=>c.id===id)?.nameZh??id;
  const dieTask=(r:Racer,purpose:string,context:Record<string,any>={},count=1):Work=>({kind:'rollBatch',racerId:r.id,purpose:`thirds-${purpose}`,count,faces:[],context});
  const trip=(r:Racer):Work=>({kind:'trip',racerId:r.id,source:'thirds'});
  const move=(r:Racer,distance:number):Work=>({kind:'move',racerId:r.id,distance,cause:'thirds'});
  function left(s:GameState,r:Racer){
    const fixed=(s.baseTurnOrder??s.racers.map(r=>r.id)),i=fixed.indexOf(r.id);
    for(let n=1;n<fixed.length;n++){const other=racer(s,fixed[(i+n)%fixed.length]!);if(other&&live(other)&&other.playerId!==r.playerId)return other;}
    return active(s).find(other=>other.id!==r.id);
  }
  function representatives(s:GameState,exclude?:string){return s.players.filter(p=>p.id!==exclude).flatMap(p=>{const r=order(s).find(r=>r.playerId===p.id);return r?[r]:[];});}
  function extreme(s:GameState,ahead=true){const rs=active(s);const value=(ahead?Math.max:Math.min)(...rs.map(r=>ctx.progress(s,r.position)));return rs.filter(r=>ctx.progress(s,r.position)===value);}
  function npcStep(s:GameState,distance:number){
    const npc=state(s)?.npc;if(!npc||npc.finished)return;
    const before=npc.position;
    for(let n=0;n<Math.abs(distance);n++){
      const options=nextTrackNodes(TRACKS[s.track],npc.position,Math.sign(distance)*(s.flags.twistReversed?-1:1));
      // Reference markers follow the shortest remaining route at a fork.
      npc.position=options.toSorted((a,b)=>Math.sign(distance)*(ctx.progress(s,b)-ctx.progress(s,a)))[0]??npc.position;
    }
    if(npc.position===ctx.finishPosition(s)&&distance>0)npc.finished=true;
    log(s,'event-marker',`${label(npc.id)}标记到第${npc.position}格`,{actor:{name:label(npc.id),characterId:npc.id},cause:`thirds-${npc.id}`,before:[before],after:[npc.position]});
  }
  function prepareRace(s:GameState){
    delete s.flags.thirds;delete s.flags.thirdsStart;
    if(s.matchPlan?.races[s.round-1]?.specialEvent!=='thrilling-thirds')return;
    let deck=s.flags.thirdsDeck as ThirdEventId[]|undefined;
    if(!deck?.length)deck=ctx.shuffle(s,Object.keys(THIRD_EVENTS)) as ThirdEventId[];
    const id=deck.shift()!;s.flags.thirdsDeck=deck;
    s.flags.thirds={id,round:s.round,held:{},extraCards:[]} satisfies ThirdsState;
    push(s,work('setup'));
  }
  function setup(s:GameState){
    const data=state(s)!;const {id}=data;
    log(s,'special-event',`特殊赛事：${label(id)} — ${THIRD_EVENTS[id]}`,{cause:`thirds-${id}`});
    const rs=order(s);
    if(id==='alchemist'){
      const cards=ctx.shuffle(s,rs.map(r=>r.characterId));rs.forEach((r,i)=>{r.characterId=cards[i]!;});
      log(s,'event-deal',rs.map(r=>`${owner(s,r).name}：${name(r)}`).join('；'),{cause:'thirds-alchemist'});
    }
    if(id==='magician'){s.track='wild';delete s.flags.twist;delete s.flags.twistReversed;}
    if(id==='inchworm'){data.newStart=15;s.flags.thirdsStart=15;rs.forEach(r=>{r.position=15;});}
    if(['baba-yaga','mouth','blimp','huge-baby','party-animal','legs','egg'].includes(id))data.npc={id,position:id==='baba-yaga'||id==='mouth'?ctx.finishPosition(s):id==='party-animal'?3:id==='egg'?5:ctx.startPosition(s)};
    if(id==='banana'){data.trampolines=[];push(s,work('trampoline'));}
    if(id==='sisyphus')for(const r of representatives(s))ctx.eventPoints(s,r,3,'特殊赛事赛前奖励');
    if(id==='centaur')for(const r of representatives(s)){
      const card=ctx.drawUnchosen(s,1)[0];if(!card)throw Error('特殊赛事额外能力缺少预留牌。');
      data.extraCards.push(card);
      for(const target of rs.filter(other=>other.playerId===r.playerId))ctx.acquirePower(target,card,{sourceCardId:card,via:'thirds-centaur'});
      log(s,'event-power',`${owner(s,r).name}的参赛者获得${label(card)}能力`,{targets:rs.filter(x=>x.playerId===r.playerId).map(x=>x.id),grantedPowerIds:[card],cause:'thirds-centaur',grantDuration:'race'});
    }
    if(id==='twin')push(s,...rs.map(r=>work('past-card',{racerId:r.id})));
  }
  function replacePower(s:GameState,r:Racer,card:string){
    const data=state(s)!;const previous=data.held[r.id];if(previous)s.discard.push(previous);
    data.held[r.id]=card;r.flags.power=card;r.flags.powerVia='thirds';r.flags.powerSourceCard=card;
    delete r.flags.copyPower;delete r.flags.copyTarget;
    log(s,'event-power',`${name(r)}本轮使用${label(card)}的能力`,{source:r.id,cause:'thirds-copycat',grantedPowerIds:[card],grantDuration:'next-turn'});
  }
  function exchange(s:GameState,rs:Racer[]){
    if(rs.length<2)return;
    const cards=rs.map(r=>({id:r.characterId,flags:structuredClone(r.flags)}));
    // The printed card and its resources travel; the current turn stays with
    // the racer seat. Position, controller and trip state never change here.
    const turnKeys=['turnStart','turnPower','turnsTaken','rerolls','mainAsked','mainRolled','mainSelection','mainBonus','mainDirection','skipMain','blimpBonus','thirdsReady','thirdsReroll','thirdsFace','thirdsRocket','thirdsGunkRepeated','nemesisPending','sabotaged','penguinRecover'];
    rs.forEach((r,i)=>{
      const keep=Object.fromEntries(turnKeys.filter(k=>k in r.flags).map(k=>[k,r.flags[k]]));
      const card=cards[(i+cards.length-1)%cards.length]!,flags={...card.flags};for(const key of turnKeys)delete flags[key];r.characterId=card.id;r.flags={...flags,...keep};
    });
    log(s,'event-exchange',rs.map(r=>`${owner(s,r).name}持有${name(r)}`).join('；'),{cause:`thirds-${state(s)!.id}`,targets:rs.map(r=>r.id)});push(s,{kind:'refreshCopies'});
  }
  function turnStartTasks(s:GameState,r:Racer):Work[]{
    if(!state(s))return [];
    delete r.flags.thirdsReady;delete r.flags.thirdsReroll;delete r.flags.thirdsFace;delete r.flags.thirdsRocket;delete r.flags.thirdsGunkRepeated;
    return [work('turn-start',{racerId:r.id})];
  }
  function mainReady(s:GameState,r:Racer){
    const data=state(s);if(!data||r.flags.thirdsReady)return false;r.flags.thirdsReady=true;
    const id=data.id;
    if(id==='rocket-scientist'){ask(s,r,'thirds-rocket','特殊赛事：改掷两骰之和并在移动后绊倒？',[{id:'use',label:'使用两骰'},{id:'skip',label:'使用原主移动'}],{},true);return true;}
    if(id==='flip-flop'){
      const targets=active(s).filter(x=>x.id!==r.id);
      if(targets.length>=2){ask(s,r,'thirds-swap-first','选择交换位置的第一名选手',[{id:'skip',label:'不交换'},...targets.map(x=>({id:x.id,label:name(x)}))],{},true);return true;}
    }
    if(id==='genius'){
      const other=left(s,r);if(!other)return false;
      data.guesses={actor:r.id,participants:[other.id],values:{},target:other.id};
      ask(s,r,'thirds-secret','秘密选择主移动距离',[2,4,6].map(n=>({id:String(n),label:String(n)})),{});return true;
    }
    if(['heckler','mastermind','lackey'].includes(id)){
      const players=id==='lackey'?[left(s,r)].filter((x):x is Racer=>!!x):representatives(s,r.playerId);
      if(players.length){data.guesses={actor:r.id,participants:players.map(x=>x.id),values:{}};push(s,work('guess'));return true;}
    }
    return false;
  }
  function guessPrompt(s:GameState){
    const data=state(s)!,g=data.guesses!;
    const id=g.participants.find(id=>g.values[id]===undefined);
    if(!id){push(s,{kind:'mainReady',racerId:g.actor});return;}
    const r=racer(s,id)!;
    const values=data.id==='lackey'?[0,1]:data.id==='genius'?[2,4,6]:[1,2,3,4,5,6];
    ask(s,r,'thirds-guess',data.id==='lackey'?'秘密猜主骰奇偶':'秘密猜主骰点数',values.map(n=>({id:String(n),label:data.id==='lackey'?(n?'奇数':'偶数'):String(n)})),{});
  }
  function beforeDie(s:GameState,r:Racer,t:Work,face:number){
    if(!event(s,'sisyphus'))return false;
    const asked=(t.thirdsPaidAsked??[]) as string[];
    const next=representatives(s).find(x=>owner(s,x).score>0&&!asked.includes(x.playerId));if(!next)return false;
    ask(s,next,'thirds-pay',`本骰${face}：支付1分要求重掷？`,[{id:'skip',label:'保留本骰'},{id:'use',label:'支付1分重掷'}],{task:{...t,heldFace:face,thirdsPaidAsked:[...asked,next.playerId]}},true);return true;
  }
  function reroll(s:GameState,r:Racer,face:number){
    if(!event(s,'dicemonger')||r.flags.thirdsReroll)return false;
    r.flags.thirdsReroll=true;ask(s,r,'thirds-reroll',`特殊赛事：掷出${face}，让其他选手前进1并重掷？`,[{id:'keep',label:'保留'},{id:'use',label:'其他人前进1，重掷'}],{face},true);return true;
  }
  function finalRoll(s:GameState,r:Racer,face:number,effects:Work[]){
    const data=state(s);if(!data)return false;r.flags.thirdsFace=face;
    if(data.id==='gunk'&&face>=5){
      const fixed=(s.flags.twist as {fixedFaces?:Record<string,number>}|undefined)?.fixedFaces?.[r.playerId];
      if(fixed===undefined||!r.flags.thirdsGunkRepeated){r.flags.thirdsGunkRepeated=true;effects.push(move(r,-1),{kind:'rollBatch',racerId:r.id,count:1,purpose:'main',faces:[]});return true;}
    }
    if(data.id==='huge-baby'&&face===1){data.npc!.position=r.position;effects.push(...order(s).filter(x=>sharing(s,x,r)).map(x=>move(x,-1)));}
    if(data.id==='hypnotist'&&face===1){effects.push({kind:'warp',plans:order(s).filter(x=>x.id!==r.id).map(x=>({racerId:x.id,position:r.position})),cause:'thirds-hypnotist'},{kind:'mainMove',racerId:r.id,base:3});return true;}
    const g=data.guesses;
    if(g&&g.actor===r.id){
      g.face=face;const wins=g.participants.filter(id=>g.values[id]===(data.id==='lackey'?face%2:face));
      log(s,'event-guesses',g.participants.map(id=>`${owner(s,racer(s,id)!).name}猜${g.values[id]}`).join('；')+`；最终骰${face}`,{cause:`thirds-${data.id}`,faces:[face]});
      if(data.id==='heckler'&&wins.length){effects.push({kind:'move',plans:wins.map(id=>({racerId:id,distance:face})),cause:'thirds-heckler'});delete data.guesses;return true;}
      if((data.id==='mastermind'||data.id==='lackey')&&wins.length)data.pendingAwards={actor:r.id,beneficiaries:wins,distance:face,points:data.id==='mastermind'};
      delete data.guesses;
    }
    return false;
  }
  function distance(s:GameState,r:Racer,value:number){
    if(event(s,'coach'))value+=active(s).filter(x=>x.id!==r.id&&sharing(s,x,r)).length;
    if(event(s,'hare')){if(extreme(s).some(x=>x.id===r.id))value-=2;if(extreme(s,false).some(x=>x.id===r.id))value+=2;}
    return value;
  }
  function settleAwards(s:GameState){
    const data=state(s),award=data?.pendingAwards;if(!award)return;delete data!.pendingAwards;
    if(award.points)for(const id of award.beneficiaries){const r=racer(s,id);if(r)ctx.eventPoints(s,r,1,'特殊赛事猜中主骰');}
    else push(s,...award.beneficiaries.flatMap(id=>{const r=racer(s,id);return r&&live(r)?[move(r,award.distance)]:[];}));
  }
  function afterMainTasks(s:GameState,r:Racer):Work[]{return state(s)?[work('after-main',{racerId:r.id})]:[];}
  function stops(s:GameState,arrivals:string[],before:Record<string,number>,motion:Work):Work[]{
    const data=state(s);if(!data)return [];
    if(!['banana','romantic','third-wheel','duelist','baba-yaga','mouth','blimp','huge-baby','party-animal','egg'].includes(data.id))return [];
    return arrivals.map(id=>work('stop',{racerId:id,from:before[id],distance:Math.abs(Number(motion.plans?.find((p:Work)=>p.racerId===id)?.distance??motion.distance??0)),motionCause:motion.cause,arrivals}));
  }
  function beforeMotion(s:GameState,t:Work){
    if(!event(s,'suckerfish')||t.kind==='warp'||t.thirdsFish)return false;
    const plans=t.plans??[{racerId:t.racerId,distance:t.distance}];
    for(const plan of plans){
      const r=racer(s,plan.racerId);if(!r||!live(r)||!plan.distance||plan.follow)continue;
      const targets=order(s).filter(x=>x.id!==r.id&&sharing(s,x,r)&&!plans.some((p:Work)=>p.racerId===x.id));
      if(targets.length){ask(s,r,'thirds-fish','可以带一名同格选手一起移动',[{id:'skip',label:'不带人'},...targets.map(x=>({id:x.id,label:name(x)}))],{motion:{...t,plans,thirdsFish:true},lead:r.id},true);return true;}
    }
    return false;
  }
  function beforeFinish(s:GameState,r:Racer){
    const data=state(s);if(data?.id!=='lovable-loser'||data.settling)return false;
    const finishes=(data.finishOrder??=[]);if(!finishes.includes(r.id))finishes.push(r.id);
    r.finished=true;r.position=ctx.finishPosition(s);
    log(s,'event-finish',`${name(r)}完赛，等待最后两名领奖。`,{source:r.id,cause:'thirds-lovable-loser'});
    const left=active(s);if(left.length<=1){if(left[0])finishes.push(left[0].id);awardLast(s);}
    return true;
  }
  function awardLast(s:GameState){
    const data=state(s)!;data.settling=true;
    const finishes=data.finishOrder??[];
    const winners=finishes.slice(-2).reverse().map(id=>racer(s,id)!).filter(r=>!r.eliminated);
    for(let i=0;i<winners.length;i++)ctx.finish(s,winners[i]!,i+1);
    if(s.phase==='race')ctx.endRace(s);
  }
  function beforeEnd(s:GameState){
    settleAwards(s);const data=state(s);
    if(data?.id==='lovable-loser'&&!data.settling){awardLast(s);return true;}return false;
  }
  function timedEnd(s:GameState){
    const rs=active(s).toSorted((a,b)=>ctx.progress(s,b.position)-ctx.progress(s,a.position));
    while(s.phase==='race'&&rs.length){
      const top=rs.filter(r=>ctx.progress(s,r.position)===ctx.progress(s,rs[0]!.position));
      const winner=top.length===1?top[0]!:racer(s,ctx.rollOff(s,top.map(r=>r.id)))!;
      ctx.finish(s,winner);rs.splice(rs.indexOf(winner),1);
    }
    if(s.phase==='race')ctx.endRace(s);
  }
  function endTurnTasks(s:GameState,r:Racer):Work[]{return state(s)?[work('turn-end',{racerId:r.id})]:[];}
  function nextTurn(s:GameState,r:Racer){
    const data=state(s);if(!data)return false;
    if(data.id==='cheerleader'){
      const last=extreme(s,false);if(!last.length)return false;
      const id=last.length===1?last[0]!.id:ctx.rollOff(s,last.map(x=>x.id));s.currentRacerId=id;s.turn=s.racers.findIndex(x=>x.id===id);s.flags.needsBegin=true;return true;
    }
    return false;
  }
  function task(s:GameState,t:Work){
    if(t.kind!=='thirds')return false;const data=state(s);if(!data)return true;
    const r=racer(s,String(t.racerId??''));
    if(t.step==='setup')setup(s);
    if(t.step==='trampoline'){
      if(data.trampolines!.length<3){const who=order(s)[0]!;ask(s,who,'thirds-trampoline','选择三个不同的蹦床格（不含起终点）',Object.keys(TRACKS[s.track].nodes??Object.fromEntries(Array.from({length:TRACKS[s.track].finish+1},(_,i)=>[i,0]))).map(Number).filter(n=>n!==ctx.startPosition(s)&&n!==ctx.finishPosition(s)&&!data.trampolines!.includes(n)).map(n=>({id:String(n),label:`第${n}格`})),{});}
    }
    if(t.step==='past-card'&&r){
      const ids=[...new Set(s.results.flatMap(result=>result.placements.map(p=>p.characterId)).concat(s.players.flatMap(p=>p.used).filter(id=>!s.racers.some(x=>x.characterId===id))))];
      if(ids.length)ask(s,r,'thirds-past','可以采用此前出赛角色的能力',[{id:'skip',label:'保留原能力'},...ids.map(id=>({id,label:label(id)}))],{},true);
    }
    if(t.step==='turn-start'&&r){
      if(data.id==='copycat'){
        const previous=data.held[r.id];if(previous){s.discard.push(previous);delete data.held[r.id];}
        const card=ctx.drawUnchosen(s,1)[0];if(!card)throw Error('换牌事件缺少预留牌。');replacePower(s,r,card);
      }
      if((data.id==='baba-yaga'||data.id==='mouth')&&!data.npc?.finished)push(s,dieTask(r,'npc'));
      if(data.id==='blimp'){npcStep(s,1);push(s,...order(s).filter(x=>x.position===data.npc!.position).map(x=>move(x,1)));}
    }
    if(t.step==='guess')guessPrompt(s);
    if(t.step==='scooch-target'&&r?.tripped){const target=racer(s,t.target);if(target&&live(target))push(s,trip(target));}
    if(t.step==='after-main'&&r){
      settleAwards(s);
      if(data.id==='skipper'&&Number(r.flags.thirdsFace)>=5)data.direction=-(data.direction??1);
      if(data.id==='leaptoad'&&live(r)&&active(s).some(x=>x.id!==r.id&&sharing(s,x,r)))r.flags.extraTurn=true;
      if(r.flags.thirdsRocket){delete r.flags.thirdsRocket;push(s,trip(r));}
      if(data.id==='scoocher'&&live(r)&&!r.tripped)ask(s,r,'thirds-scooch','自己绊倒，并绊倒一名领跑者？',[{id:'skip',label:'不使用'},...extreme(s).map(x=>({id:x.id,label:name(x)}))],{},true);
    }
    if(t.step==='stop'&&r&&live(r)){
      const others=order(s).filter(x=>x.id!==r.id&&sharing(s,x,r));
      if(data.id==='banana'&&data.trampolines?.includes(r.position)&&t.distance>0)push(s,move(r,t.distance),trip(r));
      if(data.id==='romantic'&&others.length===1&&!t.arrivals.includes(others[0]!.id))exchange(s,[r,others[0]!]);
      if(data.id==='third-wheel'&&[5,10,15,20,25].includes(r.position))exchange(s,order(s));
      if(data.id==='duelist'&&others.length)ask(s,r,'thirds-duel','选择点数，同格其他选手须掷出该数',[1,2,3,4,5,6].map(n=>({id:String(n),label:String(n)})),{targets:others.map(x=>x.id)});
      const npc=data.npc;
      if(npc&&!npc.finished&&npc.position===r.position){
        if(npc.id==='baba-yaga')push(s,trip(r));
        if(npc.id==='mouth')ctx.eliminate(s,r.id,'thirds-mouth');
        if(npc.id==='blimp')push(s,move(r,1));
        if(npc.id==='huge-baby'&&r.position!==ctx.startPosition(s))push(s,move(r,-1));
        if(npc.id==='party-animal'){ctx.eventPoints(s,r,1,'特殊赛事派对标记');npcStep(s,3);}
        if(npc.id==='egg'){npcStep(s,5);push(s,{kind:'warp',racerId:r.id,position:ctx.startPosition(s),cause:'thirds-egg'});}
      }
    }
    if(t.step==='turn-end'&&r&&data.id==='legs'){
      data.acted=[...new Set([...(data.acted??[]),r.playerId])];
      if(representatives(s).every(x=>data.acted!.includes(x.playerId))){data.acted=[];npcStep(s,5);if(data.npc?.finished)timedEnd(s);}
    }
    return true;
  }
  function choice(s:GameState,r:Racer,c:PendingChoice,id:string){
    if(!c.kind.startsWith('thirds-'))return false;const data=state(s)!,context=c.context as Record<string,any>;
    switch(c.kind){
      case 'thirds-trampoline':data.trampolines!.push(Number(id));push(s,work('trampoline'));break;
      case 'thirds-past':if(id!=='skip'){r.flags.power=id;r.flags.powerVia='thirds-past';r.flags.powerSourceCard=id;log(s,'event-power',`${name(r)}采用${label(id)}能力`,{source:r.id,grantedPowerIds:[id],grantDuration:'race',cause:c.kind});}break;
      case 'thirds-rocket':if(id==='use'){r.flags.thirdsRocket=true;push(s,dieTask(r,'rocket',{},2));}else push(s,{kind:'mainReady',racerId:r.id});break;
      case 'thirds-swap-first':if(id==='skip')push(s,{kind:'mainReady',racerId:r.id});else ask(s,r,'thirds-swap-second','选择交换位置的第二名选手',active(s).filter(x=>x.id!==r.id&&x.id!==id).map(x=>({id:x.id,label:name(x)})),{first:id});break;
      case 'thirds-swap-second':{const a=racer(s,context.first)!,b=racer(s,id)!;push(s,{kind:'warp',plans:[{racerId:a.id,position:b.position},{racerId:b.id,position:a.position}],cause:'thirds-flip-flop'},{kind:'mainReady',racerId:r.id});break;}
      case 'thirds-secret':data.guesses!.secret=Number(id);push(s,work('guess'));break;
      case 'thirds-guess':{
        const g=data.guesses!;g.values[r.id]=Number(id);
        if(data.id==='genius'){
          const target=racer(s,Number(id)===g.secret?r.id:g.actor)!;
          log(s,'event-guesses',`秘密值${g.secret}，猜测${id}；${name(target)}移动。`,{faces:[g.secret!],source:target.id,cause:c.kind});
          push(s,...(target.id===g.actor?[{kind:'mainMove',racerId:target.id,base:g.secret}]:[move(target,g.secret!)]));delete data.guesses;
        }else push(s,work('guess'));break;
      }
      case 'thirds-pay':{
        const t=context.task as Work;
        if(id==='use'){if(owner(s,r).score<1)throw Error('积分不足。');ctx.eventPoints(s,r,-1,'特殊赛事支付重掷');for(const key of ['heldFace','leafRawChecked','headsChecked','taxChecked','dieReactionsChecked','thirdsPaidAsked','reactionChecked','reactionBlocked','reactionAsked'])delete t[key];}
        push(s,t);break;
      }
      case 'thirds-reroll':if(id==='use')push(s,...order(s).filter(x=>x.id!==r.id).map(x=>move(x,1)),{kind:'rollBatch',racerId:r.id,count:1,purpose:'main',faces:[]});else push(s,{kind:'rerollWindow',racerId:r.id,face:context.face});break;
      case 'thirds-fish':{const motion=context.motion as Work;if(id!=='skip')motion.plans.push({racerId:id,follow:context.lead});push(s,motion);break;}
      case 'thirds-scooch':if(id!=='skip')push(s,trip(r),work('scooch-target',{racerId:r.id,target:id}));break;
      case 'thirds-duel':push(s,...context.targets.map((rid:string)=>dieTask(racer(s,rid)!,'duel',{face:Number(id)})));break;
    }
    return true;
  }
  function rollResult(s:GameState,r:Racer,t:Work,faces:number[]){
    if(!String(t.purpose).startsWith('thirds-'))return false;
    const data=state(s)!;
    const npc=t.purpose==='thirds-npc'?data.npc:undefined;
    log(s,'ability-dice',`${npc?label(npc.id):name(r)}掷出${faces.join('、')}`,{...(npc?{actor:{name:label(npc.id),characterId:npc.id}}:{source:r.id}),faces,cause:t.purpose});
    if(t.purpose==='thirds-rocket'){r.flags.mainRolled=true;const distance=faces.reduce((a,b)=>a+b,0);s.lastRoll={racerId:r.id,face:faces.at(-1)!,distance};push(s,{kind:'mainMove',racerId:r.id,base:distance});}
    if(t.purpose==='thirds-duel'&&faces[0]!==t.context.face)push(s,trip(r));
    if(t.purpose==='thirds-npc'){
      npcStep(s,-faces[0]!);
      if(data.id==='baba-yaga')push(s,...order(s).filter(x=>x.position===data.npc!.position).map(trip));
    }
    return true;
  }
  function finishRace(s:GameState){
    const data=state(s);if(!data)return;
    for(const id of [...Object.values(data.held),...data.extraCards])if(!s.discard.includes(id))s.discard.push(id);
    data.held={};data.extraCards=[];delete data.guesses;delete data.pendingAwards;
  }
  function publicState(s:GameState){const data=state(s);if(!data)return;return {id:data.id,description:THIRD_EVENTS[data.id],npc:data.npc?{...data.npc}:undefined,trampolines:data.trampolines?[...data.trampolines]:undefined,direction:data.direction??1,newStart:data.newStart};}
  return {state,prepareRace,turnStartTasks,mainReady,beforeDie,reroll,finalRoll,distance,afterMainTasks,stops,beforeMotion,beforeFinish,beforeEnd,endTurnTasks,nextTurn,task,choice,rollResult,finishRace,publicState};
}
