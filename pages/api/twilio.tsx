// twilio webhook
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { handleGameCommand, GameError } from "../../lib/game";

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
const formatTwilioResponse = (message: string) => {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  return twiml.toString();
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

    // Send response
    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(formatTwilioResponse(response));
  } catch (error) {
    console.error("Error processing webhook:", error);

    if (error instanceof GameError) {
      res.setHeader("Content-Type", "text/xml");
      return res
        .status(200)
        .send(formatTwilioResponse(`Error: ${error.message}`));
    }

    return res.status(500).end("Internal Server Error");
  }
}

/*
curl -X POST http://localhost:3000/api/twilio -d "Body=join" -d "From=whatsapp:+1234567890"
*/
