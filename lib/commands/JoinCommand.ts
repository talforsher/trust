import { ICommand } from "./ICommand";
import {
  getPlayerState,
  savePlayerState,
  formatMessage,
  getGameData,
  saveGameData,
} from "../game";

export class JoinCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const state = await getPlayerState(from);

    if (!state.registered) {
      return formatMessage(
        "Please register first using 'register <your_name>'"
      );
    }

    if (args.length === 0) {
      return formatMessage("Please provide a game ID to join!");
    }

    const gameId = args[0];
    const gameData = await getGameData(gameId);

    if (!gameData) {
      return formatMessage(
        "Game not found! Use 'create <n>' to create a new game."
      );
    }

    // Ensure players object exists
    if (!gameData.players) {
      gameData.players = {};
    }

    const gamePlayers = Object.values(gameData.players);
    if (gamePlayers.length >= gameData.config.maxPlayers) {
      return formatMessage("Game is full!");
    }

    state.gameId = gameId;
    state.resources = gameData.config.startingResources;
    state.defensePoints = gameData.config.startingDefense;
    state.attackPower = gameData.config.startingAttack;

    // Add player to game data
    gameData.players[from] = state;
    await saveGameData(gameId, gameData);

    return formatMessage(
      `*Welcome to ${gameData.config.name}!*\n\n` +
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
