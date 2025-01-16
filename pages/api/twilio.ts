// twilio webhook
import type { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";
import { handleGameCommand, GameError } from "../../lib/game";
import { getMessage, type SupportedLanguage } from "../../lib/i18n";

/**
 * Format a response for Twilio
 * @param message The message to format
 * @returns TwiML response
 */
function formatTwilioResponse(message: string): string {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  return twiml.toString();
}

/**
 * Check if a request is from an admin client
 * @param from The sender identifier
 * @returns Whether the sender is an admin
 */
function isAdminRequest(from: string): boolean {
  return from === "web-client";
}

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
    const language = (req.body.Language || "en") as SupportedLanguage;

    // Validate required fields
    if (!incomingMsg || !from) {
      console.error("Missing required fields:", { incomingMsg, from });
      return res.status(400).end("Missing required fields");
    }

    // Parse command and arguments
    const [command, ...args] = incomingMsg.split(" ");

    // Handle the game command
    const response = handleGameCommand(from, command, args);

    // Send response based on request type
    if (isAdminRequest(from)) {
      // If it's a help message, structure it for the UI
      if (command.toLowerCase() === "help" || !command) {
        const commands = {
          regular: [
            {
              name: "register <n>",
              description: getMessage(language, "register_desc"),
            },
            {
              name: "join <game_id>",
              description: getMessage(language, "join_desc"),
            },
            {
              name: "attack <player>",
              description: getMessage(language, "attack_desc"),
            },
            {
              name: "defend",
              description: getMessage(language, "defend_desc"),
            },
            {
              name: "collect",
              description: getMessage(language, "collect_desc"),
            },
            {
              name: "alliance <player>",
              description: getMessage(language, "alliance_desc"),
            },
            {
              name: "status",
              description: getMessage(language, "status_desc"),
            },
            {
              name: "players",
              description: getMessage(language, "players_desc"),
            },
            { name: "leave", description: getMessage(language, "leave_desc") },
          ],
          admin: [
            {
              name: "create_game <game_id> <duration_hours> <max_players>",
              description: getMessage(language, "create_game_desc"),
            },
            {
              name: "delete <player>",
              description: getMessage(language, "delete_desc"),
            },
            {
              name: "give <player> <amount>",
              description: getMessage(language, "give_desc"),
            },
            {
              name: "setlevel <player> <level>",
              description: getMessage(language, "setlevel_desc"),
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
    const responseText = await response;
    const formattedResponse = await formatTwilioResponse(responseText);
    return res.status(200).send(formattedResponse);
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

    const language = (req.body.Language || "en") as SupportedLanguage;
    if (isAdminRequest(req.body.From)) {
      return res.status(500).json({
        success: false,
        error: getMessage(language, "unknown_error"),
      });
    }
    return res.status(500).end(getMessage(language, "unknown_error"));
  }
}
