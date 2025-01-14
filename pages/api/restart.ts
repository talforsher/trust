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

    // Reset the web client's state
    const initialState: PlayerState = {
      id: "web-client",
      name: "",
      resources: 100,
      lastAttack: 0,
      lastCollect: 0,
      alliances: [],
      level: 1,
      registered: false,
    };

    await redis.set("player:web-client", initialState);
    res.status(200).json({ message: "Game restarted successfully" });
  } catch (error) {
    console.error("Error restarting game:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
