import { NextApiRequest, NextApiResponse } from "next";
import { getPlayerState } from "../../lib/game";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // For web client, we'll use a fixed ID
    const state = await getPlayerState("web-client");
    res.status(200).json(state);
  } catch (error) {
    console.error("Error getting player state:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
