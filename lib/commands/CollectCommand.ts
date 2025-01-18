import { ICommand } from "./ICommand";
import { getPlayerState, savePlayerState, formatMessage } from "../game";

const COLLECT_COOLDOWN = 600; // 10 minutes in seconds

export class CollectCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);
    const now = Math.floor(Date.now() / 1000);

    if (!state.registered || !state.gameId) {
      return formatMessage("Please join a game first!");
    }

    if (now - state.lastCollect < COLLECT_COOLDOWN) {
      const remainingTime = COLLECT_COOLDOWN - (now - state.lastCollect);
      return formatMessage(
        `⏳ Collection Cooldown: ${remainingTime} seconds remaining`
      );
    }

    const baseCollection = 15;
    const levelBonus = state.level * 2;
    const collectionAmount = baseCollection + levelBonus;

    state.resources += collectionAmount;
    state.lastCollect = now;
    await savePlayerState(from, state);

    return formatMessage(
      `💰 *Resources Collected!*\n` +
        `• Amount: ${collectionAmount} coins\n` +
        `• Total resources: ${state.resources}`
    );
  }
}
