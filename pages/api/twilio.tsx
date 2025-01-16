// twilio webhook
import twilio, { twiml } from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { handleGameCommand, GameError } from "../../lib/game";
import { v2 as cloudinary } from "cloudinary";

/**
 * Validates that the request is coming from Twilio
 */
const validateTwilioRequest = (req: NextApiRequest): boolean => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const twilioSignature = req.headers["x-twilio-signature"];
  if (!twilioSignature) return false;

  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twilio`
    : `${req.headers["x-forwarded-proto"]}://${req.headers.host}/api/twilio`;

  return twilio.validateRequest(
    authToken,
    twilioSignature as string,
    url,
    req.body
  );
};

/**
 * Formats the response for Twilio
 */
const formatTwilioResponse = (text: string, image?: string) => {
  cloudinary.config({
    cloud_name: "efsi",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const cloudinaryUrl = "https://res.cloudinary.com/efsi/image/upload/";
  const url = Math.random().toString(36).substring(2, 15);
  const imageUrl = `${cloudinaryUrl}/${url}.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="50" font-family="Arial, sans-serif" font-size="24" fill="white">${text}</text></svg>`;
  cloudinary.uploader.upload(svg, {
    public_id: url,
    width: 100,
    height: 100,
    format: "png",
  });

  const twiml = new twilio.twiml.MessagingResponse();
  const message = twiml.message(text);
  // if (image) {
  message.media(imageUrl);
  // }
  return twiml.toString();
};

/**
 * Checks if the request is from an admin
 */
const isAdminRequest = (from: string): boolean => {
  return from === "web-client";
};

/**
 * Twilio webhook handler
 * @description Handles incoming WhatsApp messages through Twilio
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Validate Twilio request
    // if (!validateTwilioRequest(req)) {
    //   console.error("Invalid Twilio signature");
    //   return res.status(401).end("Unauthorized");
    // }

    const incomingMsg = req.body.Body?.trim();
    const from = req.body.From;

    // Validate required fields
    if (!incomingMsg || !from) {
      console.error("Missing required fields:", { incomingMsg, from });
      return res.status(400).end("Missing required fields");
    }

    console.log("Received message:", incomingMsg, "from:", from);

    // Parse command and arguments
    const [command, ...args] = incomingMsg.split(" ");

    // Handle the game command
    const response = await handleGameCommand(from, command, args);

    // Send response based on request type
    if (isAdminRequest(from)) {
      // If it's a help message, structure it for the UI
      if (command.toLowerCase() === "help" || !command) {
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
        return res.status(200).json({
          success: true,
          isHelp: true,
          commands,
        });
      }
      return res.status(200).json({ success: true, message: response });
    }

    // Send Twilio response for regular users
    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(formatTwilioResponse(response));
  } catch (error) {
    console.error("Error processing webhook:", error);

    if (error instanceof GameError) {
      if (isAdminRequest(req.body.From)) {
        return res.status(200).json({
          success: false,
          error: error.message,
        });
      }
      res.setHeader("Content-Type", "text/xml");
      return res
        .status(200)
        .send(formatTwilioResponse(`Error: ${error.message}`));
    }

    if (isAdminRequest(req.body.From)) {
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
    return res.status(500).end("Internal Server Error");
  }
}
