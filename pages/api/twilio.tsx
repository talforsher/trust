// twilio webhook
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";

const twilioWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Get the incoming message body
  const incomingMsg = req.body.Body;
  console.log("Received message:", incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message("thanks");

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};

export default twilioWebhook;
