import { ICommand } from "./ICommand";
import { formatMessage } from "../game";

export class HelpCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    if (from === "web-client") {
      // Return structured help for web client
      const commands = {
        regular: [
          { name: "register <name>", description: "Set your player name" },
          { name: "join <game_id>", description: "Join a game" },
          { name: "attack <player>", description: "Attack another player" },
          { name: "defend", description: "Boost your defense" },
          { name: "collect", description: "Gather resources" },
          { name: "alliance <player>", description: "Propose alliance" },
          { name: "status", description: "Check your status" },
          { name: "players", description: "List all players" },
          { name: "leave", description: "Leave current game" },
        ],
        admin: [
          {
            name: "create_game <game_id> <duration_hours> <max_players>",
            description: "Create a new game",
          },
          { name: "delete <player>", description: "Delete a player" },
          {
            name: "give <player> <amount>",
            description: "Give resources to a player",
          },
          {
            name: "setlevel <player> <level>",
            description: "Set a player's level",
          },
        ],
      };
      return JSON.stringify({ success: true, isHelp: true, commands });
    }

    // Return formatted help for WhatsApp users
    return formatMessage(
      "*Available Commands:*\n" +
        "• *register <n>*: Set your player name\n" +
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
