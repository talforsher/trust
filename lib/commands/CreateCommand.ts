import { ICommand } from "./ICommand";
import {
  getPlayerState,
  savePlayerState,
  formatMessage,
  saveGameData,
} from "../game";
import { GameData } from "../game";

export class CreateCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);
    const now = Math.floor(Date.now() / 1000);

    if (!state.registered) {
      return formatMessage(
        "Please register first using 'register <your_name>'"
      );
    }

    if (args.length === 0) {
      return formatMessage("Please provide a name for the game!");
    }

    const gameName = args.join(" ");
    const newGameId = Math.floor(10000 + Math.random() * 90000).toString();
    const newGameData: GameData = {
      config: {
        id: newGameId,
        name: gameName,
        duration: 24 * 3600, // 24 hours
        maxPlayers: 10,
        startingResources: 100,
        startingDefense: 50,
        startingAttack: 30,
        createdAt: now,
        hostId: from,
      },
      players: {},
      status: "active",
    };

    // Set up the player's state for the new game
    state.gameId = newGameId;
    state.resources = newGameData.config.startingResources;
    state.defensePoints = newGameData.config.startingDefense;
    state.attackPower = newGameData.config.startingAttack;

    // Add player to game data
    newGameData.players[from] = state;

    // Save the new game
    await saveGameData(newGameId, newGameData);

    return formatMessage(
      `*Game Created!*\nGame '${gameName}' created with ID: ${newGameId}\n\n` +
        "🎮 *Available Commands:*\n" +
        "• *attack <player>*: Attack another player\n" +
        "• *defend*: Boost your defense\n" +
        "• *collect*: Gather resources\n" +
        "• *alliance <player>*: Propose alliance\n" +
        "• *status*: Check your status\n" +
        "• *players*: List all players\n" +
        "• *leave*: Leave the game"
    );
  }
}
