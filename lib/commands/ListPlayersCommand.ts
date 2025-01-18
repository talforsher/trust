import { ICommand } from "./ICommand";
import { getAllPlayers, formatMessage } from "../game";

export class ListPlayersCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    const players = await getAllPlayers();
    const registeredPlayers = players.filter((p) => p.registered);

    if (registeredPlayers.length === 0) {
      return formatMessage("No players found!");
    }

    const playerList = registeredPlayers
      .map((p) => `• ${p.name} (Level ${p.level})`)
      .join("\n");

    return formatMessage(`*Players in the game:*\n${playerList}`);
  }
}
