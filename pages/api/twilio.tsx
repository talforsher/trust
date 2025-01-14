// twilio webhook
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { handleGameCommand } from "../../lib/game";

const twilioWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate that the request is coming from Twilio
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twilio`
    : `${req.headers["x-forwarded-proto"]}://${req.headers.host}/api/twilio`;

  // Get the incoming message and sender
  const incomingMsg = req.body.Body;
  const from = req.body.From; // This will be the WhatsApp number

  console.log("Received message:", incomingMsg, "from:", from);

  // Parse command and arguments
  const [command, ...args] = incomingMsg.trim().split(" ");

  // Handle the game command
  const response = await handleGameCommand(from, command, args);

  // If request is from web client, return JSON
  if (from === "web-client") {
    res.status(200).json({ message: response });
    return;
  }

  // Otherwise, send response back through Twilio for WhatsApp
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(response);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};

export default twilioWebhook;

/*
curl -X POST http://localhost:3000/api/twilio -d "Body=join" -d "From=whatsapp:+1234567890"
*/
