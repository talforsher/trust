import { ICommand } from "./ICommand";
import { getPlayerState, savePlayerState, formatMessage } from "../game";

export class LeaveCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);

    if (!state.registered || !state.gameId) {
      return formatMessage("Please join a game first!");
    }

    state.gameId = "";
    state.resources = 100; // Reset to default
    state.defensePoints = 50;
    state.attackPower = 30;
    state.lastAttack = 0;
    state.lastCollect = 0;
    state.lastDefense = 0;
    state.alliances = [];
    state.pendingAlliances = [];

    await savePlayerState(from, state);

    return formatMessage(
      "*You have left the game.*\n" +
        "Use 'join <game_id>' to join another game!"
    );
  }
}
