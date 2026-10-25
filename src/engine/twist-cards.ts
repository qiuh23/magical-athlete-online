import { CHARACTERS } from '../shared/characters.js';
import type { ChoiceOption, GameState, PendingChoice, Player, Racer, Task } from '../shared/types.js';
import { TWIST_CARDS, type TwistCardId } from '../shared/twists.js';
export { TWIST_CARDS, type TwistCardId } from '../shared/twists.js';

type Work=Task&Record<string,any>;
interface ExtraRacer { round:number; playerId:string; characterId:string; powers:string[]; borrowedCard?:string }
interface SwapOffer { playerId:string; cardId?:string; racerId?:string; decided:boolean }
export interface TwistState {
  triggered:boolean; deck:TwistCardId[]; drawn:TwistCardId[]; triggerId?:string;
  conveyor?:boolean; bonkbug?:boolean; scryingPool?:boolean; curseWands?:boolean;
  chips?:number[]; fixedFaces?:Record<string,number>;
  monster?:{position:number;racerId?:string;finished?:boolean};
  finale?:{stage:'qualifying'|'duel';qualifiers:string[];reward:number};
  swap?:SwapOffer[];
}
export interface TwistContext {
  name:(r:Racer)=>string; live:(r:Racer)=>boolean; racer:(s:GameState,id:string)=>Racer|undefined;
  active:(s:GameState)=>Racer[]; owner:(s:GameState,r:Racer)=>Player;
  order:(s:GameState,rs?:Racer[])=>Racer[];
  hasPower:(s:GameState,r:Racer,power:string)=>boolean;
  effectivePowers:(s:GameState,r:Racer)=>string[];
  ask:(s:GameState,r:Racer,kind:string,title:string,options:ChoiceOption[],context:Record<string,any>,optional?:boolean)=>void;
  push:(s:GameState,...tasks:Work[])=>void;
  log:(s:GameState,type:string,text:string,detail?:Record<string,any>)=>void;
  points:(s:GameState,r:Racer,delta:number,cause:string)=>void;
  shuffle:(s:GameState,ids:string[])=>string[];
  drawUnchosen:(s:GameState,count:number)=>string[];
  /** An actual new die, without this module's fixed-face replacement. */
  rawDie:(s:GameState,r:Racer|undefined,reason:string)=>number;
  eliminate:(s:GameState,id:string,source:string)=>void;
  finish:(s:GameState,r:Racer,forcedRank?:number)=>void;
  endRace:(s:GameState,cycleDraw?:boolean)=>void;
  startPosition:(s:GameState)=>number;
  finishPosition:(s:GameState)=>number;
  firstCorner:(s:GameState)=>number;
  secondCorner:(s:GameState)=>number;
  progress:(s:GameState,position:number)=>number;
  /** A logical forward step count converted to a physical node. */
  positionAt:(s:GameState,progress:number)=>number;
  raceRewards:(s:GameState)=>readonly number[];
}

/** All card continuations and private commitments are JSON state. */
export function installTwists(ctx:TwistContext){
  const {name,live,racer,active,owner,order,hasPower,effectivePowers,ask,push,log}=ctx;
  const state=(s:GameState)=>s.flags.twist as TwistState|undefined;
  const work=(step:string,more:Record<string,any>={}):Work=>({kind:'twist',step,...more});
  const title=(id:string)=>CHARACTERS.find(c=>c.id===id)?.nameZh??id;
  const die=(s:GameState,r:Racer|undefined,reason:string)=>r?state(s)?.fixedFaces?.[r.playerId]??ctx.rawDie(s,r,reason):ctx.rawDie(s,undefined,reason);
  function prepareRace(s:GameState){
    delete s.flags.twistReversed;delete s.flags.twistFinaleStarted;
    delete s.flags.twist;
    if(String(s.track)==='twisty-twirl')s.flags.twist={triggered:false,deck:ctx.shuffle(s,TWIST_CARDS.map(c=>c.id)) as TwistCardId[],drawn:[]} satisfies TwistState;
    const extras=(s.flags.twistNextRaceExtras??[]) as ExtraRacer[];
    for(const extra of extras.filter(x=>x.round===s.round)){
      if(!s.players.some(p=>p.id===extra.playerId))continue;
      s.racers.push({id:`${extra.playerId}:${s.round}:time-imp:${s.racers.length}`,identityPlayerId:extra.playerId,playerId:extra.playerId,characterId:extra.characterId,position:ctx.startPosition(s),finished:false,eliminated:false,tripped:false,flags:{acquiredPowers:extra.powers.filter(p=>p!==extra.characterId),timeImpExtra:true,...(extra.borrowedCard?{twistBorrowedCardId:extra.borrowedCard}:{})}});
    }
    s.flags.twistNextRaceExtras=extras.filter(x=>x.round>s.round);
  }
  function trigger(s:GameState,triggerId:string){
    const t=state(s);if(!t||t.triggered)return false;
    t.triggered=true;t.triggerId=triggerId;push(s,work('draw',{triggerId}));return true;
  }
  function crossingTasks(s:GameState,moves:{racerId:string;from:number;to:number}[]):Work[]{
    const t=state(s);if(!t||t.triggered)return [];
    const candidates=moves.filter(m=>(m.from<=13&&m.to>=14)||(m.from>=14&&m.to<=13));
    const first=order(s,s.racers.filter(r=>candidates.some(m=>m.racerId===r.id)))[0];
    if(!first)return [];
    t.triggered=true;t.triggerId=first.id;
    return [work('draw',{triggerId:first.id})];
  }
  function applyCard(s:GameState,id:TwistCardId,triggerId:string){
    const t=state(s);if(!t)return;
    const source=racer(s,triggerId);
    switch(id){
      case 'alchemy-lab':{
        const bite=order(s).find(r=>hasPower(s,r,'bite-mark'));
        t.monster={position:ctx.startPosition(s),...(bite?{racerId:bite.id}:{})};
        if(bite){bite.flags.form='were-mouth';push(s,{kind:'warp',racerId:bite.id,position:ctx.startPosition(s),cause:'twist-alchemy-lab'});}
        log(s,'twist-monster','狼人巨口出现在起点，每个回合结束后行动。',{cause:id,...(bite?{source:bite.id}:{})});break;
      }
      case 'bonkbug':t.bonkbug=true;break;
      case 'conveyor':
        t.conveyor=true;push(s,{kind:'warp',plans:order(s).map(r=>({racerId:r.id,position:ctx.positionAt(s,1)})),cause:'twist-conveyor'});break;
      case 'curse-wands':t.curseWands=true;break;
      case 'fans':push(s,work('draw',{triggerId}),work('draw',{triggerId}));break;
      case 'mirror-world':
        s.flags.twistReversed=!s.flags.twistReversed;
        log(s,'race-direction','比赛方向反转，棋子保留原位。',{cause:id});
        push(s,work('reverse-finish'));break;
      case 'scrying-pool':t.scryingPool=true;break;
      case 'pinata':{
        const finish=ctx.progress(s,ctx.finishPosition(s)),first=ctx.progress(s,ctx.firstCorner(s));
        const occupied=new Set(active(s).map(r=>r.position));
        t.chips=Array.from({length:Math.max(0,finish-first-1)},(_,i)=>ctx.positionAt(s,first+i+1)).filter(p=>!occupied.has(p));break;
      }
      case 'randomness-ceased':{
        const faces:Record<string,number>={};
        for(const p of s.players){const r=s.racers.find(r=>r.playerId===p.id);faces[p.id]=ctx.rawDie(s,r,'Twist固定骰');}
        t.fixedFaces=faces;
        log(s,'twist-fixed-dice',s.players.map(p=>`${p.name}本场所有骰固定为${faces[p.id]}`).join('；'),{cause:id,faces:s.players.map(p=>faces[p.id]!)});break;
      }
      case 'roast-chicken':{
        const last=Math.min(...active(s).map(r=>ctx.progress(s,r.position)));
        push(s,...order(s).filter(r=>ctx.progress(s,r.position)===last).map(r=>({kind:'move',racerId:r.id,distance:7,cause:'twist-roast-chicken'})));break;
      }
      case 'season-finale':
        if((s.flags.placements as unknown[]|undefined)?.length){
          log(s,'house-rule','网页裁定：季终决战迟于首次颁奖时不再改赛制；保留已经结算的奖励与技能链，按原赛程继续。',{source:triggerId,cause:id});break;
        }
        t.finale={stage:'qualifying',qualifiers:[],reward:ctx.raceRewards(s).slice(0,2).reduce((a,b)=>a+b,0)};break;
      case 'swap-meet':{
        const participants=s.players.filter(p=>active(s).some(r=>r.playerId===p.id));
        const cards=ctx.drawUnchosen(s,participants.length);
        t.swap=participants.map((p,i)=>({playerId:p.id,cardId:cards[i],decided:!cards[i]}));
        if(cards.length<participants.length){
          s.phase='paused';s.flags.awaitRoll=false;s.flags.needsBegin=false;
          s.flags.ruleHold={kind:'twist-swap-cards',message:`交换集市需要${participants.length}张未选角色牌，实际仅有${cards.length}张；保留已抽牌与完整局面，暂停等待处理，未给部分玩家少发牌。`};
          push(s,work('swap-prompt'));break;
        }
        push(s,work('swap-prompt'));break;
      }
      case 'time-imp':
        if(source&&live(source)){
          const extras=(s.flags.twistNextRaceExtras??=[]) as ExtraRacer[];
          const rounds=s.matchPlan?.raceCount??s.config?.competition?.raceCount??4;
          if(s.round<rounds)extras.push({round:s.round+1,playerId:source.playerId,characterId:source.characterId,powers:hasPower(s,source,'mush')?effectivePowers(s,source):[],...(typeof source.flags.twistBorrowedCardId==='string'?{borrowedCard:source.flags.twistBorrowedCardId}:{})});
          ctx.eliminate(s,source.id,'twist-time-imp');
        }
        break;
    }
  }
  function swapPrompt(s:GameState){
    const t=state(s);if(!t?.swap)return;
    const offer=t.swap.find(o=>!o.decided);
    if(!offer){
      const changed:Racer[]=[];
      // Every answer stays private until all participants have committed.
      for(const choice of t.swap){
        const r=choice.racerId?racer(s,choice.racerId):undefined;
        if(choice.cardId&&r&&live(r)&&r.playerId===choice.playerId){
          s.discard.push(r.characterId);r.characterId=choice.cardId;
          const mount=r.flags.hogOwnerId;r.flags={twistBorrowedCardId:choice.cardId,...(mount?{hogOwnerId:mount}:{})};changed.push(r);
        }else if(choice.cardId)s.discard.push(choice.cardId);
      }
      log(s,'twist-swap',changed.length?changed.map(r=>`${owner(s,r).name}换为${name(r)}`).join('；'):'所有人保留当前角色。',{cause:'swap-meet',targets:changed.map(r=>r.id)});
      delete t.swap;push(s,{kind:'refreshCopies'});return;
    }
    const owned=order(s).filter(r=>r.playerId===offer.playerId);
    if(!owned.length){offer.decided=true;push(s,work('swap-prompt'));return;}
    ask(s,owned[0]!,'twist-swap',`交换集市：抽到${title(offer.cardId!)}，可替换自己的一个在赛角色`,[{id:'keep',label:'保留原角色'},...owned.map(r=>({id:`swap:${r.id}`,label:`用${title(offer.cardId!)}替换${name(r)}`}))],{},true);
  }
  function choice(s:GameState,r:Racer,c:PendingChoice,id:string){
    if(c.kind!=='twist-swap')return false;
    const offer=state(s)?.swap?.find(o=>o.playerId===r.playerId&&!o.decided);if(!offer)throw Error('交换集市选择已结束。');
    if(id!=='keep'){
      const target=racer(s,id.slice(5));if(!id.startsWith('swap:')||!target||!live(target)||target.playerId!==r.playerId)throw Error('只能替换自己的在赛角色。');
      offer.racerId=target.id;
    }
    offer.decided=true;push(s,work('swap-prompt'));return true;
  }
  function monsterTurn(s:GameState,rollerId?:string){
    const t=state(s),monster=t?.monster;if(!monster||monster.finished)return;
    if(monster.racerId){
      const r=racer(s,monster.racerId);if(!r||!live(r)){monster.finished=true;return;}
      const face=die(s,r,'狼人巨口额外移动');
      log(s,'ability-dice',`${name(r)}因实验室泄漏掷出${face}`,{source:r.id,faces:[face],cause:'twist-alchemy-lab'});
      push(s,{kind:'move',racerId:r.id,distance:face,cause:'twist-alchemy-lab'});return;
    }
    const from=ctx.progress(s,monster.position),face=die(s,rollerId?racer(s,rollerId):undefined,'游荡狼人巨口移动');
    const actor={name:'游荡巨口',characterId:'mouth'};
    log(s,'ability-dice',`游荡巨口掷出${face}`,{actor,cause:'twist-alchemy-lab',faces:[face]});
    const end=from+face,limit=ctx.progress(s,ctx.finishPosition(s));
    const crossed=order(s).filter(r=>ctx.progress(s,r.position)>from&&ctx.progress(s,r.position)<end);
    monster.position=ctx.positionAt(s,Math.min(end,limit));monster.finished=end>=limit;
    log(s,'twist-monster',`游荡巨口前进至${monster.position}格。`,{actor,cause:'twist-alchemy-lab',faces:[face],before:[ctx.positionAt(s,from)],after:[monster.position]});
    push(s,...crossed.map(r=>({kind:'eliminate',racerId:r.id,source:'twist-alchemy-lab'})));
  }
  function task(s:GameState,t:Work){
    if(t.kind!=='twist')return false;
    const data=state(s);if(!data)return true;
    switch(t.step){
      case 'draw':{
        const id=data.deck.shift();if(!id)return true;data.drawn.push(id);
        log(s,'twist',`Twist：${TWIST_CARDS.find(c=>c.id===id)!.name}`,{source:t.triggerId,cause:id});
        applyCard(s,id,String(t.triggerId));break;
      }
      case 'swap-prompt':swapPrompt(s);break;
      case 'monster':monsterTurn(s,t.rollerId);break;
      case 'reverse-finish':
        for(const r of order(s).filter(r=>r.position===ctx.finishPosition(s))){ctx.finish(s,r);if(s.phase!=='race')break;}
        break;
      case 'curse-next':{
        const current=racer(s,String(t.racerId));if(!current)return true;
        const fixed=s.baseTurnOrder??s.racers.map(r=>r.id),face=die(s,current,'诅咒魔杖跳过行动者');
        log(s,'ability-dice',`${name(current)}掷出${face}，跳过${face}个行动席位。`,{source:current.id,cause:'twist-curse-wands',faces:[face]});
        const index=fixed.indexOf(current.id),next=racer(s,fixed[(index+face+1)%fixed.length]!);
        if(!next)return true;
        if(live(next)){s.currentRacerId=next.id;s.turn=s.racers.indexOf(next);s.flags.needsBegin=true;}
        else{
          const visited=(t.fixedVisited??[]) as string[];
          if(data.fixedFaces&&visited.includes(next.id)){
            const start=fixed.indexOf(next.id);
            const available=Array.from({length:fixed.length},(_,i)=>racer(s,fixed[(start+i+1)%fixed.length]!)).find(r=>r&&live(r));
            if(available){s.currentRacerId=available.id;s.turn=s.racers.indexOf(available);s.flags.needsBegin=true;}
            log(s,'house-rule','网页裁定：固定骰跳席形成离场席位闭环，跳出闭环，由下一名在赛选手行动。',{cause:'twist-curse-wands',...(available?{source:available.id}:{})});return true;
          }
          push(s,work('curse-next',{racerId:next.id,fixedVisited:data.fixedFaces?[...visited,next.id]:[]}));
        }
        break;
      }
    }
    return true;
  }
  function boardTasks(s:GameState,r:Racer):Work[]{
    const t=state(s);if(!t||!live(r))return [];
    if(t.chips?.includes(r.position)){t.chips=t.chips.filter(p=>p!==r.position);ctx.points(s,r,1,'赛道星格');}
    const remaining=ctx.progress(s,ctx.finishPosition(s))-ctx.progress(s,r.position);
    return t.bonkbug&&(remaining===1||remaining===2)?[{kind:'move',racerId:r.id,distance:-5,cause:'twist-bonkbug'}]:[];
  }
  function mainDistance(s:GameState,_r:Racer,distance:number){return distance+(state(s)?.conveyor?3:0);}
  function blocksMain(s:GameState,r:Racer,distance:number){
    if(!state(s)?.scryingPool||Math.abs(distance)<6)return false;
    ctx.eliminate(s,r.id,'twist-scrying-pool');return true;
  }
  function endTurnTasks(s:GameState,r:Racer):Work[]{return state(s)?.monster?[work('monster',{rollerId:r.id})]:[];}
  function nextTurn(s:GameState,r:Racer){if(!state(s)?.curseWands)return false;push(s,work('curse-next',{racerId:r.id}));return true;}
  function fixedDie(s:GameState,r:Racer){return state(s)?.fixedFaces?.[r.playerId];}
  function finishSoleFinalist(s:GameState,r:Racer){
    const f=state(s)!.finale!;f.stage='duel';f.qualifiers=[r.id];r.finished=false;
    log(s,'finale','季终决战只剩一名选手，取得本场全部名次分。',{source:r.id,cause:'season-finale'});
    ctx.finish(s,r);
    if(s.phase==='race')ctx.endRace(s);
    return true;
  }
  function beforeFinish(s:GameState,r:Racer){
    const f=state(s)?.finale;if(!f||f.stage!=='qualifying')return false;
    if(!f.qualifiers.length&&!active(s).some(other=>other.id!==r.id))return finishSoleFinalist(s,r);
    if(!f.qualifiers.includes(r.id)){f.qualifiers.push(r.id);r.finished=true;r.position=ctx.finishPosition(s);log(s,'finale-qualifier',`${name(r)}取得季终决战第${f.qualifiers.length}个资格。`,{source:r.id,cause:'season-finale'});}
    if(f.qualifiers.length<2){
      const copycatMind=(r:Racer)=>{
        const owned=[r.characterId,r.flags.power,r.flags.copiedPower,...((r.flags.acquiredPowers??[]) as string[])];
        return owned.includes('copycat')&&!owned.includes('mastermind');
      };
      const minds=order(s,s.racers.filter(other=>!other.eliminated&&other.id!==r.id&&other.flags.prediction===r.id&&hasPower(s,other,'mastermind'))).sort((a,b)=>Number(copycatMind(a))-Number(copycatMind(b)));
      if(minds[0])ctx.finish(s,minds[0],2);
      return true;
    }
    f.stage='duel';s.queue=[];s.pending=undefined;s.flags.placements=[];s.flags.awaitRoll=false;
    for(const other of s.racers){
      if(f.qualifiers.includes(other.id)){other.finished=false;other.eliminated=false;other.tripped=false;delete other.rank;other.position=ctx.secondCorner(s);}
      else if(live(other)){other.eliminated=true;other.flags.twistFinaleOut=true;}
    }
    s.currentRacerId=f.qualifiers[0];s.turn=s.racers.findIndex(r=>r.id===s.currentRacerId);s.flags.needsBegin=true;s.flags.twistFinaleStarted=true;
    log(s,'finale','季终决战：原前两名从第二弯道争夺全部名次分，原第一名先行动。',{cause:'season-finale',targets:[...f.qualifiers]});return true;
  }
  function placementPoints(s:GameState,_r:Racer,rank:number,value:number){const f=state(s)?.finale;return f?.stage==='duel'?(rank===1?f.reward:0):value;}
  function beforeRaceEnd(s:GameState){
    const f=state(s)?.finale;
    if(f?.stage!=='qualifying'||f.qualifiers.length!==1||active(s).length)return false;
    const finalist=racer(s,f.qualifiers[0]!);
    return finalist&&!finalist.eliminated?finishSoleFinalist(s,finalist):false;
  }
  function raceEnd(s:GameState){
    const reserved=new Set(((s.flags.twistNextRaceExtras??[]) as ExtraRacer[]).filter(e=>e.round>s.round).map(e=>e.borrowedCard));
    for(const r of s.racers){
      const id=r.flags.twistBorrowedCardId;
      if(typeof id==='string'&&!reserved.has(id)&&!s.discard.includes(id))s.discard.push(id);
    }
  }
  function publicState(s:GameState){
    const t=state(s);if(!t)return undefined;
    const {deck:_,swap:__,...shown}=t;return structuredClone(shown);
  }
  return {prepareRace,trigger,crossingTasks,applyCard,task,choice,boardTasks,mainDistance,blocksMain,endTurnTasks,nextTurn,fixedDie,beforeFinish,beforeRaceEnd,placementPoints,raceEnd,publicState};
}
