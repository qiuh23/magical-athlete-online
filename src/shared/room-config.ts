import { CHARACTERS } from './characters.js';
import { TRACKS, type TrackId } from './tracks.js';
import type { CharacterPool } from './types.js';
import { competitionConfig, validateCompetition, type CompetitionConfig } from './competition.js';

export const ROOM_CONFIG_VERSION = 'room-config-v1' as const;
export const CHARACTER_PACK_IDS = ['original', 'second-wind', 'extra-mile', 'leaf-fan', 'wurstii'] as const;
export type CharacterPackId = typeof CHARACTER_PACK_IDS[number];
export type ThreePlayerMode = 'single' | 'double';
export interface RoomConfig {
  version: typeof ROOM_CONFIG_VERSION;
  characterPacks: Record<Exclude<CharacterPackId, 'wurstii'>, boolean> & { wurstii?: boolean }; // Older v1 saves omit Wurstii.
  /** No independent optional scoring variants have been verified yet. */
  optionalRules: [];
  competition?: CompetitionConfig;
  visibility?: 'public' | 'private';
  /** Omitted by older rooms, which use one racer each with three players. */
  threePlayerMode?: ThreePlayerMode;
}
export function legacyRoomConfig(pool: CharacterPool = 'original', practice = false): RoomConfig {
  return { version: ROOM_CONFIG_VERSION, characterPacks: { original: practice || pool !== 'second-wind', 'second-wind': practice || ['second-wind','mixed','all'].includes(pool), 'extra-mile': false, 'leaf-fan': false, wurstii: pool === 'wurstii' || pool === 'all' }, optionalRules: [] };
}
export function validateRoomConfig(value: unknown): RoomConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('角色包配置无效。');
  const config = value as Record<string, unknown>, packs = config.characterPacks;
  if (Object.keys(config).some(key => !['version','characterPacks','optionalRules','competition','visibility','threePlayerMode'].includes(key)) || config.version !== ROOM_CONFIG_VERSION || !packs || typeof packs !== 'object' || Array.isArray(packs)) throw Error('角色包配置版本或字段无效。');
  const flags = packs as Record<string, unknown>;
  if (CHARACTER_PACK_IDS.some(id => !(id === 'wurstii' && flags[id] === undefined) && typeof flags[id] !== 'boolean') || Object.keys(flags).some(id => !CHARACTER_PACK_IDS.includes(id as CharacterPackId))) throw Error('角色包开关无效。');
  if (!Array.isArray(config.optionalRules) || config.optionalRules.length) throw Error('没有已核实的独立可选玩法，请勿提交未知玩法。');
  const result:RoomConfig = {version:ROOM_CONFIG_VERSION,characterPacks:Object.fromEntries(CHARACTER_PACK_IDS.map(id=>[id,flags[id] === true])) as Record<CharacterPackId,boolean>,optionalRules:[]};
  if(config.competition!==undefined)result.competition=validateCompetition(config.competition);
  if(config.visibility!==undefined){if(config.visibility!=='public'&&config.visibility!=='private')throw Error('房间可见性无效。');result.visibility=config.visibility;}
  if(config.threePlayerMode!==undefined){if(config.threePlayerMode!=='single'&&config.threePlayerMode!=='double')throw Error('三人玩法只能选择每人单角色或每人双角色。');result.threePlayerMode=config.threePlayerMode;}
  if (!enabledCharacterIds(result).length) throw Error('请至少启用一个含已完成角色的角色包。');
  return result;
}
export function enabledCharacterIds(config?: RoomConfig, legacyPool: CharacterPool = 'original', practice = false): string[] {
  const enabled = config ?? legacyRoomConfig(legacyPool, practice);
  const blocked=new Set(blockedMapCharacters(config));
  return CHARACTERS.filter(character => {
    const edition: string = character.edition ?? 'original';
    const pack = edition === 'leaf' ? 'leaf-fan' : edition;
    return enabled.characterPacks[pack as CharacterPackId] === true && !blocked.has(character.id);
  }).map(character => character.id);
}
export function blockedMapCharacters(config?: RoomConfig): string[] {
  return [...new Set(competitionConfig(config).rotation.flatMap(id=>TRACKS[id as TrackId]?.blockedCharacters??[]))];
}
export function racersPerPlayer(players:number,config?:Pick<RoomConfig,'threePlayerMode'>):1|2 {
  return players===2||players===3&&config?.threePlayerMode==='double'?2:1;
}
export function requiredCharacterCount(players:number,practice=false,rounds=4,threePlayerMode?:ThreePlayerMode):number { return practice?rounds:players*rounds*racersPerPlayer(players,{threePlayerMode}); }
/** Physical reserves, not an alternate draw pool. Egg returns its three cards;
 * Twin reads champion history. Film hands and temporary displays hold cards. */
export function characterResources(config:RoomConfig,players:number,practice=false) {
  const ids=new Set(enabledCharacterIds(config)),rounds=competitionConfig(config).raceCount;
  const drafted=requiredCharacterCount(players,practice,rounds,config.threePlayerMode),slots=practice?1:players*racersPerPlayer(players,config);
  const events=competitionConfig(config).thrillingThirds.enabled;
  const filmSources=['leaf-filmmaker','egg','twin','understudy','leaf-zombie'].filter(id=>ids.has(id)).length;
  const film=ids.has('leaf-filmmaker')?7*(events?slots:Math.min(slots,filmSources)):0;
  // Copied Thespian / Filmmaker can hold one display of each kind per racer.
  const displays=ids.has('leaf-thespian')?slots:0;
  const abilityDraw=ids.has('egg')?3:ids.has('mush')||ids.has('leaf-thespian')?1:0;
  const draw=Math.max(abilityDraw,competitionConfig(config).rotation.includes('twisty-twirl')?(practice?1:players):0);
  // Copycat retains one real card per racer; Centaur retains one per player.
  const eventCards=events?Math.max(slots,players):0;
  const reserve=film+displays+draw+eventCards;
  return {available:ids.size,drafted,reserve,required:drafted+reserve};
}
export function validateRoomConfigForPlayers(config:RoomConfig,players:number,practice=false):RoomConfig {
  const normalized=validateRoomConfig(config),rounds=competitionConfig(normalized).raceCount;
  const {available,drafted,reserve,required}=characterResources(normalized,players,practice);
  if(available<required)throw Error(`当前角色包共${available}名可用角色，${practice?'个人练习':`${players}人${rounds}场比赛`}至少需要${required}名（选秀${drafted}名，技能抽牌预留${reserve}名），缺${required-available}名。请启用更多已完成角色包、减少人数或减少场数。`);
  return normalized;
}
export function roomConfigError(config:RoomConfig,players:number,practice=false):string {
  try{validateRoomConfigForPlayers(config,players,practice);return '';}catch(error){return error instanceof Error?error.message:'配置无效。';}
}
/** Compatibility projection for clients that still display the old selector. */
export function legacyPoolForConfig(config: RoomConfig): CharacterPool {
  return config.characterPacks.original ? config.characterPacks['second-wind'] ? 'mixed' : 'original' : 'second-wind';
}
export const MULTIPLAYER_ROOM_LIMIT = 30;
export const ROOM_CAPACITY_MESSAGE = '当前实时对战房间已满，请稍后重试。';
