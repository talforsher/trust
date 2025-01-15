import { NextApiRequest, NextApiResponse } from "next";
import { getPlayerState, GameError } from "../../lib/game";

/**
 * API response types
 */
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Status endpoint handler
 * @description Gets the current state of a player
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET requests are allowed",
      },
    });
  }

  try {
    const state = await getPlayerState("web-client");

    if (!state) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PLAYER_NOT_FOUND",
          message: "Player state not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Error getting player state:", error);

    if (error instanceof GameError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
}
