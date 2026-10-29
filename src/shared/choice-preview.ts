import { CHARACTERS } from './characters.js';
import type { ChoiceDiceHint, GameEvent, GameState, PendingChoice, PendingChoiceView, Task } from './types.js';

const characterIds = new Set(CHARACTERS.map(card => card.id));
const knownCard = (id: unknown): id is string => typeof id === 'string' && characterIds.has(id);

const dieFace = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6;
const publicDiceTypes = new Set(['die', 'die-trigger', 'roll', 'ability-dice', 'multi-dice']);

/** Describe this decision's public die, never a prior turn or a hidden contest result. */
function choiceDice(game: GameState, choice: PendingChoice): ChoiceDiceHint | undefined {
  if (['duel-roll', 'em-cletus-roll', 'cheatah-guess', 'thirds-guess'].includes(choice.kind)) return;
  const context = choice.context;
  const hint = (racerId: unknown, faces: unknown, characterId?: string): ChoiceDiceHint | undefined => {
    if (!Array.isArray(faces) || !faces.length || !faces.every(dieFace)) return;
    if (knownCard(characterId)) return { characterId, faces: [...faces] };
    const racer = game.racers.find(racer => racer.id === racerId);
    return racer ? { racerId: racer.id, faces: [...faces] } : undefined;
  };
  const eventHint = (event?: GameEvent) => event && publicDiceTypes.has(event.type) ? hint(event.source, event.faces, event.actor?.characterId) : undefined;
  const taskHint = (task: Task | undefined, publicOnly = false) => {
    if (!task || task.kind !== 'rollBatch' || ['duel', 'em-cletus'].includes(String(task.purpose)) || !dieFace(task.heldFace)) return;
    const event = game.logs.find(event => event.id === task.dieEventId);
    if (publicOnly) return eventHint(event);
    const npc = task.purpose === 'thirds-npc' ? (game.flags.thirds as { npc?: { id: string } } | undefined)?.npc : undefined;
    return hint(task.racerId, [task.heldFace], event?.actor?.characterId ?? npc?.id);
  };
  // A raw-die reaction may interrupt the throw before lastRoll is updated.
  const interruptedDie = () => {
    for (const task of game.queue) { const result = taskHint(task, true); if (result) return result; }
  };
  const currentDie = (racerId?: unknown) => {
    const turn = game.logs.findLastIndex(event => event.type === 'turn');
    if (turn < 0) return;
    for (let index = game.logs.length - 1; index > turn; index--) {
      const event = game.logs[index]!;
      if (racerId !== undefined && event.source !== racerId) continue;
      const result = eventHint(event); if (result) return result;
    }
  };
  if (choice.kind === 'critic') return hint(context.target, [context.face]);
  if (choice.kind === 'nemesis') return hint(context.targetId ?? game.currentRacerId, [context.face]);
  if (choice.kind === 'thirds-pay' || choice.kind === 'em-heads') return taskHint(context.task as Task | undefined);
  if (choice.kind === 'em-fox') {
    const task = context.task as Task | undefined;
    // Before a new throw there is no result to show, even if this turn had other dice.
    if (task?.kind === 'rollDie' || task?.kind === 'rollBatch') return taskHint(task);
    return interruptedDie() ?? currentDie();
  }
  if (dieFace(context.face)) return hint(choice.racerId, [context.face]);
  if (choice.kind === 'leaf-philanthropist-die') return hint(choice.racerId, context.faces);
  if (choice.kind === 'leaf-philanthropist-target' || choice.kind === 'mr-dice-pick' || choice.kind === 'mr-dice-reroll') return currentDie(choice.racerId);
  if (choice.kind === 'suckerfish' || choice.kind === 'thirds-fish' || choice.kind === 'track-branch') {
    const motion = context.motion as Task | undefined;
    return interruptedDie() ?? (motion?.cause === 'main' ? currentDie(context.lead ?? choice.racerId) : undefined);
  }
}

function choiceRacers(game: GameState, choice: PendingChoice, diceHint?: ChoiceDiceHint) {
  const ids = new Set<string>();
  const add = (id: unknown) => { if (typeof id === 'string' && game.racers.some(racer => racer.id === id)) ids.add(id); };
  const references = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const context = value as Record<string, unknown>;
    for (const key of ['sourceId', 'source', 'targetId', 'target', 'lead', 'duelistId', 'cheatahId', 'racerId']) add(context[key]);
    if (Array.isArray(context.targets)) context.targets.forEach(add);
    if (Array.isArray(context.plans)) for (const plan of context.plans) if (plan && typeof plan === 'object') add(plan.racerId);
  };
  references(choice.context); references(choice.context.task); references(choice.context.motion);
  add(diceHint?.racerId); add(choice.racerId);
  for (const option of choice.options) add(choice.kind === 'twist-swap' && option.id.startsWith('swap:') ? option.id.slice(5) : option.id);
  return [...ids];
}

/** Called inside the existing private pending-choice projection. Never copy context. */
export function projectChoice(game: GameState, choice: PendingChoice): PendingChoiceView {
  const champions = choice.kind === 'twin' ? choice.context.champions as Record<string, { power?: unknown }> | undefined : undefined;
  const swap = choice.kind === 'twist-swap' ? (game.flags.twist as { swap?: { playerId: string; cardId?: string; decided: boolean }[] } | undefined)?.swap : undefined;
  const offered = swap?.find(offer => offer.playerId === choice.playerId && !offer.decided)?.cardId;
  const diceHint = choiceDice(game, choice);
  const relatedRacerIds = choiceRacers(game, choice, diceHint);
  return {
    id: choice.id, playerId: choice.playerId, racerId: choice.racerId, title: choice.title,
    optional: choice.optional, kind: choice.kind,
    ...(knownCard(offered) ? { offeredCharacterId: offered } : {}),
    ...(diceHint ? { diceHint } : {}),
    ...(relatedRacerIds.length ? { relatedRacerIds } : {}),
    options: choice.options.map(option => {
      const racerId = choice.kind === 'twist-swap' && option.id.startsWith('swap:') ? option.id.slice(5) : option.id;
      const racer = game.racers.find(value => value.id === racerId);
      const power = champions?.[option.id]?.power;
      const characterId = knownCard(power) ? power : racer?.characterId ?? (knownCard(option.id) ? option.id : undefined);
      return { id: option.id, label: option.label, ...(characterId ? { characterId } : {}), ...(racer ? { racerId: racer.id } : {}) };
    }),
  };
}
