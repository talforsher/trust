import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";
import { PlayerState, GameData, GAME_CONSTANTS } from "../../lib/game";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const redis = Redis.fromEnv();

    // Delete all existing games
    const allGameKeys = await redis.keys("game:*");
    if (allGameKeys.length > 0) {
      await Promise.all(allGameKeys.map((key) => redis.del(key)));
    }

    const now = Math.floor(Date.now() / 1000);
    const adminPlayer: PlayerState = {
      id: "web-client",
      name: "Admin",
      gameId: "admin-game",
      resources: 1000,
      defensePoints: 100,
      attackPower: 100,
      lastAttack: 0,
      lastCollect: 0,
      lastDefense: 0,
      lastRecoveryCheck: 0,
      alliances: [],
      pendingAlliances: [],
      level: 10,
      registered: true,
      successfulBattles: 0,
      messageHistory: [],
      lastMessage: undefined,
      language: "en",
    };

    // Create a new game with admin as host
    const initialGameData: GameData = {
      config: {
        id: "admin-game",
        name: "Admin Game",
        duration: 24 * 3600, // 24 hours
        maxPlayers: 10,
        startingResources: GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES,
        startingDefense: GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS,
        startingAttack: GAME_CONSTANTS.DEFAULT_ATTACK_POWER,
        createdAt: now,
        hostId: "web-client",
      },
      players: {
        "web-client": adminPlayer,
      },
      status: "active",
    };

    await redis.set("game:admin-game", initialGameData);
    res.status(200).json({
      message:
        "Game restarted successfully - All games deleted and admin game created",
    });
  } catch (error) {
    console.error("Error restarting game:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
