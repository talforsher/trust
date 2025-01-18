import { ICommand } from "./ICommand";
import {
  getPlayerState,
  savePlayerState,
  formatMessage,
  findPlayerByName,
} from "../game";

export class AllianceCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);

    if (!state.registered || !state.gameId) {
      return formatMessage("Please join a game first!");
    }

    if (args.length === 0) {
      return formatMessage("Please provide a player to propose alliance!");
    }

    const targetPlayer = await findPlayerByName(args[0]);
    if (!targetPlayer) {
      return formatMessage("Player not found! Please try again.");
    }

    if (targetPlayer.id === from) {
      return formatMessage("You cannot form an alliance with yourself!");
    }

    if (state.alliances.includes(targetPlayer.id)) {
      return formatMessage(
        `You already have an alliance with ${targetPlayer.name}!`
      );
    }

    state.pendingAlliances.push(targetPlayer.id);
    await savePlayerState(from, state);

    return formatMessage(
      `*Alliance proposal sent to ${targetPlayer.name}!*\n` +
        `They will need to accept your proposal.`
    );
  }
}
