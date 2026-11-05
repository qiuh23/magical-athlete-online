import houseRules from '../../docs/house-rules.md?raw';
import competitionRules from '../../public/rules/competition.md?raw';
import eventRules from '../../public/rules/special-events.md?raw';
import bridgeRules from '../../public/rules/bridges.md?raw';
import wurstiiRules from '../../public/rules/wurstii-a.md?raw';
import secondWindRules from '../../public/rules/second-wind-verification.md?raw';
import { useId, useRef, useState } from 'react';
import { TRACK_CATALOG } from '../shared/competition.js';
import { RuleDocument } from './RuleDocument.js';
import './rules-content.css';

// Ship the actual public house rules with the app; players never need repository access.
export function RulesContent({ browser = false }: { browser?: boolean }) {
  const [section,setSection]=useState(0),[reference,setReference]=useState(''),id=useId(),panel=useRef<HTMLDivElement>(null);
  const sections=['基础与操作','地图与计分','角色包与人数','特殊赛事'];
  const playerCompetitionRules=competitionRules.slice(competitionRules.indexOf('## 当前可玩'),competitionRules.indexOf('## 来源与资料缺口'));
  function selectSection(index:number){setSection(index);setReference('');panel.current?.closest('.modal-panel')?.scrollTo({top:0});}
  function navigate(file:string){
    const next=file==='special-events.md'?3:['wurstii-a.md','second-wind-verification.md'].includes(file)?2:1;
    setSection(next);setReference(file);
    requestAnimationFrame(()=>panel.current?.querySelector<HTMLElement>('[data-rule-reference="'+file+'"]')?.scrollIntoView({block:'start'}));
  }
  return <div className="rules-copy rules-menu">
    <div className="rules-sections" role="tablist" aria-label="规则分类">{sections.map((name,index)=><button key={name} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-content`} aria-selected={section===index} tabIndex={section===index?0:-1} onClick={()=>selectSection(index)} onKeyDown={event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?sections.length-1:(index+(event.key==='ArrowRight'?1:-1)+sections.length)%sections.length;
      selectSection(next);document.getElementById(`${id}-tab-${next}`)?.focus();
    }}>{name}</button>)}</div>
    <div ref={panel} id={`${id}-content`} role="tabpanel" aria-labelledby={`${id}-tab-${section}`}>
      {section===0&&<CoreRulesContent browser={browser} />}
      {section===1&&<><h3>七张地图</h3><dl className="map-rule-list">{Object.entries(TRACK_CATALOG).map(([map,info])=><div key={map}><dt>{info.name} · {info.kind}</dt><dd>{info.description}</dd></div>)}</dl><RuleDocument text={playerCompetitionRules} onNavigate={navigate} /><section data-rule-reference="bridges.md"><RuleDocument text={bridgeRules} onNavigate={navigate} /></section></>}
      {section===2&&<>
        <h3>角色包独立选择</h3><p>地图方案不会改变角色包开关。好友房与人机默认仅启用基础角色，练习默认启用基础角色和 Second Wind；三个粉丝包默认关闭。每张角色的完整技能、来源与网页裁定可在角色详情阅读。</p>
        <ul className="pack-rule-list">
          <li><strong>基础角色包 · 36 位</strong>：CMYK 基础角色与已采用 FAQ 裁定。<a href="https://www.cmyk.games/products/magical-athlete" target="_blank" rel="noreferrer">CMYK 原作</a></li>
          <li><strong>Second Wind · 36 位</strong>：已对照官方规则书核对卡面；仍保留公开的网页差异，跨扩展组合待复核。美术与最初技能转录参考玩家图鉴。</li>
          <li><strong>Extra Mile · 31 位 · 非官方</strong>：依作者网页 v13 与 PDF 卡面核对。Box 需要实体骰子入盒，网页版暂不可用；网页32人名单外的 Groundhogs Day 不导入。<a href="https://johnnlds.github.io/Magical-Athlete-Racers/?v=13" target="_blank" rel="noreferrer">作者图鉴</a></li>
          <li><strong>Leaf’s Fan Expansion · 18 位 · 非官方</strong>：依作者 Printable Cards、Rulebook 与 PNG 原图核验。<a href="https://boardgamegeek.com/filepage/327878/leafs-fan-expansion-for-magical-athlete" target="_blank" rel="noreferrer">作者发布页</a></li>
          <li><strong>Wurstii A · 30 位 · 非官方</strong>：采用作者自制角色的网页适配卡文；与其他包混用的平衡性待实战验证。</li>
        </ul>
        <h3>人数玩法与配置权限</h3><p>单人练习每场一位角色。两人每场每人双角色；实际入座三人时，房主开局前确认每人单角色或双角色，人数上限大于三人的房间也会确认。三人双角色与7–8人为非官方变体，平衡性尚未验证。</p><p>双角色按暗选时安排的顺序逐个完成回合，下一场由本场得分较少的玩家先行动，同分掷骰决定。黏液怪不减速同一玩家的另一位选手；其他能力仍按各自目标规则处理。</p><p>房主可在选秀前调整并保存，修改后全员重新准备。开始选秀锁定整局配置，完整对局结束后可修改下一局；非房主与观战者只能查看。创建按人数上限、开局按实际人数检查牌池；选秀和技能抽牌共用实体牌池，预留不足会提示增加角色包或减少人数、场数。</p>
        <h3>方案切换与自定义</h3><p>三个快捷方案替换场数与地图轮换，保留角色包和特殊赛事开关、场次。自定义的场数和地图顺序会留作草稿，选择“自定义”可恢复；离开建房页返回首页或切换创建、练习、人机入口也保留本次草稿。地图依顺序循环，允许重复添加、上移、下移和移除。减少场数保留原地图与赛事场次；超出范围时需手动修正后再提交。</p>
        <details open={reference==='second-wind-verification.md'||undefined} data-rule-reference="second-wind-verification.md"><summary>Second Wind：卡面核验与网页差异</summary><RuleDocument text={secondWindRules} onNavigate={navigate} /></details>
        <details open={reference==='wurstii-a.md'||undefined} data-rule-reference="wurstii-a.md"><summary>Wurstii A：完整卡文与适配</summary><RuleDocument text={wurstiiRules} onNavigate={navigate} /></details>
      </>}
      {section===3&&<RuleDocument text={eventRules} onNavigate={navigate} />}
    </div>
  </div>;
}

function CoreRulesContent({ browser = false }: { browser?: boolean }) {
  const rules = houseRules.split(/\r?\n/).filter(line => line.startsWith('- ')).map(line => line.slice(2));
  return <div className="core-rules">
    <p>默认参加四场经典赛；也可在赛前选择项目自定义的六场或八场。每人每场使用一位尚未出赛的角色，两人模式每人每场两位。实际入座三人时，房主在开局前选择每人单角色或双角色，人数上限大于三人的房间也会提示；三人双角色是本项目变体。总分决定胜负。</p>
    <ol>
      <li><strong>邀请与准备</strong>：创建房间，把网站链接和房间号发给朋友。朋友打开网站，输入昵称和房间号即可入座，全员准备后由房主开局。</li>
      <li><strong>蛇形选秀</strong>：四场双人保留两批选秀，每批每人选四张。三人双角色及六／八场按人数两倍翻牌，顺序和逆序各选一名，下批首选顺延；每人准备场数乘以每场选手数的角色。每张初始角色独一无二。</li>
      <li><strong>暗选再揭示</strong>：单角色模式每场选一位未使用的角色；双角色模式（两人及三人双角色）每场各选两位，并在确认前设置先后行动顺序。本场顺序锁定，下一场重新选择；先完整结算一名选手的回合再进行下一名，掷骰前已确定行动者。其他玩家只能看到你是否选好，直到大家一起揭示。</li>
      <li><strong>掷骰与技能</strong>：轮到选手时，系统先自动处理回合开始能力；有选择就先选技能，完成后再点击掷骰。有人需要做决定时，比赛会等待对应玩家；点击棋子或头像读取完整技能。</li>
      <li><strong>赛道与积分</strong>：默认经典四场依次为温和、狂野、温和、狂野；自定义赛程按所选列表循环。狂野星格得1分，OUPS格绊倒，箭头格按正负提示移动。各场冠亚军得分为3/1、4/2、5/3、6/4；第二位冲线后立即结束当场。全部场次总分相同共享胜利。六场奖励依次为3/1、4/2、4/2、5/3、5/3、6/4，八场为3/1、3/1、4/2、4/2、5/3、5/3、6/4、6/4。</li>
    </ol>
    <h3>房间交流</h3>
    <p>左下角“聊天”供本房间选手和观战者交流；收起时新消息逐条从下方加入，旧消息向上移动；电脑最多 5 条、手机最多 3 条，每条停留约 8 秒后消退。未读数量保留，点击即可展开完整聊天记录。大厅、选秀、全部场次和重新连接共用最近 100 条记录，补齐历史不会冒泡。个人信息或比赛菜单可以修改昵称，每局所有场次合计一次；同名自动追加数字，历史聊天保留发送时昵称。</p>
    <h3>绊倒后还能做什么？</h3>
    <p>绊倒不会关闭角色能力。它影响的是下一次主移动：轮到该阶段时改为起身，不掷主移动骰，也不按骰子走格。若在本回合主移动开始前倒下，就在本回合用起身替代；已经开始的移动要先完整结算。</p>
    <ul>
      <li><strong>技能继续按条件发动</strong>：回合开始的加油、召唤、派对和得分，以及香蕉、芭芭雅嘎、浪漫家、蹭蹭怪等被动能力，仍检查各自的触发条件。</li>
      <li><strong>仍能被技能或赛道移动</strong>：前进、后退、随行和传送照常结算，倒地状态保留，直到恢复阶段；起身本身不算移动。</li>
      <li><strong>主移动相关能力没有独立走格</strong>：起身回合不能用大长腿的5格或人字拖换位绕过，也没有自己的主骰供炼金、火箭加倍、预测或重掷使用。教练、飞艇等主移动修正不会另送一段移动。</li>
      <li><strong>独立技能骰仍可掷</strong>：如合法决斗，倒地双方仍可比较骰子，胜者按技能前进；决斗骰不算主移动骰。决斗选定对象后，双方依次点击“掷决斗骰”（AI自动完成），两个结果全部生成后一起揭晓，再展示胜者前进。</li>
      <li><strong>野兔例外</strong>：正式对局中，野兔回合开始时独自领先会跳过主移动；倒地时也不能借这次跳过起身。单人练习的特别处理见下方房规。</li>
      <li><strong>续作例外按卡文处理</strong>：企鹅倒地时仍按自己的能力投主骰并加倍，不等于免疫绊倒；水管的回合结束范围骰独立于主移动，即使本回合起身也可发动。</li>
    </ul>
    <p>依据发行商<a href="https://iello.fr/athletes-de-compete-tatillon-repond-a-vos-questions/" target="_blank" rel="noreferrer">FAQ 的绊倒、动作时序与角色说明</a>核对。技能仍须满足时机和合法目标，并非倒地后可任意发动。</p>
    <h3>自己练习与人机对战</h3>
    <p>首页选择“自己练习”，从完整角色牌池中选择本局所需的4／6／8张不同角色，可查看技能、取消和重选。单人每场使用一位角色，自己冲线即结束当场。练习房不进入观战列表。选择“人机对战”可添加1～7位电脑选手；AI会自动选秀、出场、掷骰和响应技能。AI只根据公开赛场和自己的手牌选择，看不到他人的暗选或未来骰子。人机仍使用对应人数的正式流程，7～8人采用下方标注的网页扩展规则。</p>
    <p>所有类型房间在房主（默认创建者）仍有有效连接时保留，在线闲置不会过期。最后一个房主标签页离开后，由服务器计时，个人练习连续离开 10 分钟、人机与好友房连续离开 30 分钟到期；期间返回取消计时。到期时若对局尚未完成，在线真人选手须在 60 秒内全部同意才续赛，观战者只接收提示。续赛只完成当前这一场，离线席位由 AI 临时代打，回来后可接手；本场结果展示后解散，不能进入下一场或再来一局。有人拒绝、超时未确认、无人在线或已终局则关闭。旧浏览器主持房间仍需房主在期限内返回。房主退出当前页会保留房间；练习与人机房还可确认“解散房间”立即关闭。</p>
    <p>全站最多同时保留 30 个真人对战房间，等待、比赛、重连与结束后仍有效的房间均占名额；个人练习和独立人机房不占名额。达到上限仍可加入已有房间。</p>
    <p>本项目自定义双角色规则（两人及三人双角色）：每人按暗选时安排的先后顺序行动；下一场由本场得分较少的玩家先行动，同分掷骰决定。黏液怪的减速排除同一玩家控制的全部选手，只影响符合条件的对方选手。此豁免仅用于黏液怪的减速，其他角色仍按各自规则确定目标。</p>
    <h3>镜头与操作</h3>
    <p>镜头起初看自己的棋子，自动观看当前投骰和发动技能的选手；空档停留在最近行动者，不反复回自己，自己的下一回合或回合外技能开始时再跟过去。“总览”始终显示整条赛道，小地图持续显示位置和格数。拖动、双指或滚轮缩放暂停自动跟拍；点击“回到自己”恢复。镜头菜单可关闭“自动观看他人行动”。掷骰、技能和移动按确认顺序播放，之后才显示待选技能和下一场；技能至少保留阅读时间，可手动跳过积压演出。六骰与能力骰公开显示，等待六骰选择或重投时保留结果。点击头像可查看技能和当前控制者。画质、声音、动效、积分和播报在比赛菜单中。</p>
    {browser && <><h3>保存与恢复牌局</h3><p>对局进度自动保存，刷新后可用原身份继续。动画、镜头和跳过演出不会改变结果。显式“转交房主”移交游戏管理权限和离线保留期限的归属，刷新或退出不会自动移交。</p><p>旧版房间需保持创建房间的原浏览器标签页打开；离线后要等待它返回。请勿清理该浏览器的站点数据。完整对局结束后，新建房间即可选择新增角色包。</p></>}

    <h3>本房间采用的网页房规</h3>
    <p>以下为项目公开约定，独立于官方规则；每位访客都可在此完整阅读。</p>
    <ul className="house-rules-list">{rules.map((rule, index) => <li key={index}>{rule}</li>)}</ul>
    <h3>关于规则来源</h3>
    <p>原作依据 CMYK 更新版基础规则书与 IELLO 2026-08-28 v2.0 FAQ 核对。Second Wind 另已对照官方规则书核对36张卡面，网页差异在“角色包与人数”中列明。玩家图鉴的 Interactions 不作为官方裁定。Extra Mile 使用作者网页 v13 与 PDF 卡面交叉核对；Witch Hazel 按 PDF 的单一目标卡文实现。Leaf 使用作者 Printable Cards、Rulebook 和 PNG 原图核验。角色详情公开来源及项目数字化裁定。</p>
    <p>这是非官方同好项目，中文角色名为本项目译名。<a href="https://iello.fr/athletes-de-compete-tatillon-repond-a-vos-questions/" target="_blank" rel="noreferrer">发行商现行 FAQ</a>和<a href="https://www.cmyk.games/products/magical-athlete" target="_blank" rel="noreferrer">CMYK 原作</a>可公开查看。</p>
  </div>;
}
