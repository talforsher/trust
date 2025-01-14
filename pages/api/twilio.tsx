// twilio webhook
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";

const twilioWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate that the request is coming from Twilio
  const twilioSignature = req.headers["x-twilio-signature"];
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioSignature || !authToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twilio`
    : `${req.headers["x-forwarded-proto"]}://${req.headers.host}/api/twilio`;

  const isValidRequest = twilio.validateRequest(
    authToken,
    twilioSignature as string,
    url,
    req.body
  );

  if (!isValidRequest) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Get the incoming message body
  const incomingMsg = req.body.Body;
  console.log("Received message:", incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message("thanks");

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};

export default twilioWebhook;
