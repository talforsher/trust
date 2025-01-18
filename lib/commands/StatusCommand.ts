import { ICommand } from "./ICommand";
import { getPlayerState } from "../game";
import { formatMessage } from "../game";

export class StatusCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);
    return formatMessage(
      `*Status:*\n` +
        `• Name: ${state.name}\n` +
        `• Game ID: ${state.gameId}\n` +
        `• Resources: ${state.resources}\n` +
        `• Defense: ${state.defensePoints}\n` +
        `• Attack: ${state.attackPower}\n` +
        `• Level: ${state.level}`
    );
  }
}
