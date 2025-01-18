import { ICommand } from "./ICommand";
import { formatMessage } from "../game";

export class HelpCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    return formatMessage(
      "*Available Commands:*\n" +
        "• *register <name>*: Set your player name\n" +
        "• *join <game_id>*: Join a game\n" +
        "• *attack <player>*: Attack another player\n" +
        "• *defend*: Boost your defense\n" +
        "• *collect*: Gather resources\n" +
        "• *alliance <player>*: Propose alliance\n" +
        "• *status*: Check your status\n" +
        "• *players*: List all players\n" +
        "• *leave*: Leave current game\n" +
        "• *config lang <language>*: Set your language"
    );
  }
}
