import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";
import { PlayerState } from "../../lib/game";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const redis = Redis.fromEnv();

    // Delete all existing players
    const allPlayerKeys = await redis.keys("player:*");
    if (allPlayerKeys.length > 0) {
      await Promise.all(allPlayerKeys.map((key) => redis.del(key)));
    }

    // Reset the web client's state with admin privileges
    const initialState: PlayerState & { isAdmin?: boolean } = {
      id: "web-client",
      name: "Admin",
      gameId: "",
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
      isAdmin: true,
      successfulBattles: 0,
      messageHistory: [],
      lastMessage: undefined,
    };

    await redis.set("player:web-client", initialState);
    res.status(200).json({
      message:
        "Game restarted successfully - All players deleted and admin privileges granted",
    });
  } catch (error) {
    console.error("Error restarting game:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
