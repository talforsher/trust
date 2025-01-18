import { ICommand } from "./ICommand";
import { getPlayerState, savePlayerState, formatMessage } from "../game";

export class RegisterCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);

    if (state.registered) {
      return formatMessage("You are already registered!");
    }

    if (args.length === 0) {
      return formatMessage("Please provide your name!");
    }

    state.name = args.join(" ");
    state.registered = true;
    await savePlayerState(from, state);

    return formatMessage(
      `*Welcome ${state.name}!* You've been registered successfully. Type 'join <game_id>' to join a game!`
    );
  }
}
