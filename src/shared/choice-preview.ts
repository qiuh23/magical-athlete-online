import { CHARACTERS } from './characters.js';
import type { GameState, PendingChoice, PendingChoiceView } from './types.js';

const characterIds = new Set(CHARACTERS.map(card => card.id));
const knownCard = (id: unknown): id is string => typeof id === 'string' && characterIds.has(id);

/** Called inside the existing private pending-choice projection. Never copy context. */
export function projectChoice(game: GameState, choice: PendingChoice): PendingChoiceView {
  const champions = choice.kind === 'twin' ? choice.context.champions as Record<string, { power?: unknown }> | undefined : undefined;
  const swap = choice.kind === 'twist-swap' ? (game.flags.twist as { swap?: { playerId: string; cardId?: string; decided: boolean }[] } | undefined)?.swap : undefined;
  const offered = swap?.find(offer => offer.playerId === choice.playerId && !offer.decided)?.cardId;
  return {
    id: choice.id, playerId: choice.playerId, racerId: choice.racerId, title: choice.title,
    optional: choice.optional, kind: choice.kind,
    ...(knownCard(offered) ? { offeredCharacterId: offered } : {}),
    options: choice.options.map(option => {
      const racerId = choice.kind === 'twist-swap' && option.id.startsWith('swap:') ? option.id.slice(5) : option.id;
      const racer = game.racers.find(value => value.id === racerId);
      const power = champions?.[option.id]?.power;
      const characterId = knownCard(power) ? power : racer?.characterId ?? (knownCard(option.id) ? option.id : undefined);
      return { id: option.id, label: option.label, ...(characterId ? { characterId } : {}), ...(racer ? { racerId: racer.id } : {}) };
    }),
  };
}
