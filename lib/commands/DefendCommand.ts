import { ICommand } from "./ICommand";
import { getPlayerState, savePlayerState, formatMessage } from "../game";

const DEFENSE_COOLDOWN = 3600; // 1 hour in seconds

export class DefendCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);
    const now = Math.floor(Date.now() / 1000);

    if (!state.registered || !state.gameId) {
      return formatMessage("Please join a game first!");
    }

    if (now - state.lastDefense < DEFENSE_COOLDOWN) {
      const remainingTime = DEFENSE_COOLDOWN - (now - state.lastDefense);
      return formatMessage(
        `⏳ Defense Cooldown: ${remainingTime} seconds remaining`
      );
    }

    const defenseBoost = Math.floor(state.level * 5);
    state.defensePoints += defenseBoost;
    state.lastDefense = now;
    await savePlayerState(from, state);

    return formatMessage(
      `🛡️ *Defense Boosted!*\n` +
        `• Boost amount: ${defenseBoost}\n` +
        `• Total defense: ${state.defensePoints}`
    );
  }
}
