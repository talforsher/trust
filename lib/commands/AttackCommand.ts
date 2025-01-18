import { ICommand } from "./ICommand";
import {
  getPlayerState,
  savePlayerState,
  formatMessage,
  findPlayerByName,
} from "../game";

export class AttackCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);
    const now = Math.floor(Date.now() / 1000);

    if (!state.registered || !state.gameId) {
      return formatMessage("Please join a game first!");
    }

    if (args.length === 0) {
      return formatMessage("Please provide a player to attack!");
    }

    const targetPlayer = await findPlayerByName(args[0]);
    if (!targetPlayer) {
      return formatMessage("Player not found! Please try again.");
    }

    // Calculate damage based on attacker's power and defender's defense
    const rawDamage = Math.max(
      0,
      state.attackPower - targetPlayer.defensePoints
    );
    const levelMultiplier = state.level / targetPlayer.level;
    const damage = Math.floor(rawDamage * levelMultiplier);
    const stolenCoins = Math.floor(damage * 0.1);

    state.resources += stolenCoins;
    targetPlayer.resources -= damage;

    await savePlayerState(from, state);
    await savePlayerState(targetPlayer.id, targetPlayer);

    return formatMessage(
      `*Attack successful!*\n` +
        `• Damage dealt: ${damage}\n` +
        `• Coins stolen: ${stolenCoins}\n` +
        `• Target: ${targetPlayer.name}`
    );
  }
}
