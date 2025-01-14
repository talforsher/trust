// twilio webhook
import twilio from "twilio";
import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Game commands
const COMMANDS = {
  JOIN: "join",
  ATTACK: "attack",
  COLLECT: "collect",
  ALLIANCE: "alliance",
  STATUS: "status",
  HELP: "help",
} as const;

// Cooldown times (in seconds)
const COOLDOWNS = {
  ATTACK: 300, // 5 minutes
  COLLECT: 600, // 10 minutes
};

interface PlayerState {
  resources: number;
  lastAttack: number;
  lastCollect: number;
  alliances: string[];
}

const getPlayerState = async (playerId: string): Promise<PlayerState> => {
  const state = await redis.get<PlayerState>(`player:${playerId}`);
  if (!state) {
    return {
      resources: 100, // Starting resources
      lastAttack: 0,
      lastCollect: 0,
      alliances: [],
    };
  }
  return state;
};

const savePlayerState = async (playerId: string, state: PlayerState) => {
  await redis.set(`player:${playerId}`, JSON.stringify(state));
};

const handleGameCommand = async (
  playerId: string,
  command: string,
  args: string[]
): Promise<string> => {
  const state = await getPlayerState(playerId);
  const now = Math.floor(Date.now() / 1000);

  switch (command.toLowerCase()) {
    case COMMANDS.JOIN:
      await savePlayerState(playerId, state);
      return (
        "Welcome to Alliance Wars! You start with 100 resources. Available commands:\n" +
        "- join: Start playing\n" +
        "- attack <player>: Attack another player\n" +
        "- collect: Gather resources\n" +
        "- alliance <player>: Propose alliance\n" +
        "- status: Check your status"
      );

    case COMMANDS.ATTACK:
      if (args.length === 0) return "Please specify a player to attack";
      if (now - state.lastAttack < COOLDOWNS.ATTACK) {
        return `You must wait ${
          COOLDOWNS.ATTACK - (now - state.lastAttack)
        } seconds before attacking again`;
      }
      const targetId = args[0];
      const targetState = await getPlayerState(targetId);

      const damage = Math.floor(Math.random() * 30) + 10;
      targetState.resources = Math.max(0, targetState.resources - damage);
      state.lastAttack = now;

      await savePlayerState(targetId, targetState);
      await savePlayerState(playerId, state);
      return `You attacked ${targetId} and dealt ${damage} damage! They now have ${targetState.resources} resources.`;

    case COMMANDS.COLLECT:
      if (now - state.lastCollect < COOLDOWNS.COLLECT) {
        return `You must wait ${
          COOLDOWNS.COLLECT - (now - state.lastCollect)
        } seconds before collecting again`;
      }
      const collected = Math.floor(Math.random() * 20) + 10;
      state.resources += collected;
      state.lastCollect = now;
      await savePlayerState(playerId, state);
      return `You collected ${collected} resources! You now have ${state.resources} resources.`;

    case COMMANDS.ALLIANCE:
      if (args.length === 0) return "Please specify a player to ally with";
      const allyId = args[0];
      if (state.alliances.includes(allyId)) {
        return "You are already allied with this player";
      }
      state.alliances.push(allyId);
      await savePlayerState(playerId, state);
      return `Alliance proposal sent to ${allyId}! They need to ally with you too for it to be active.`;

    case COMMANDS.STATUS:
      return (
        `Your status:\n` +
        `Resources: ${state.resources}\n` +
        `Alliances: ${state.alliances.join(", ") || "None"}\n` +
        `Attack ready: ${
          now - state.lastAttack >= COOLDOWNS.ATTACK ? "Yes" : "No"
        }\n` +
        `Collect ready: ${
          now - state.lastCollect >= COOLDOWNS.COLLECT ? "Yes" : "No"
        }`
      );

    default:
      return "Unknown command. Send 'help' for available commands.";
  }
};

const twilioWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate that the request is coming from Twilio
  //   const twilioSignature = req.headers["x-twilio-signature"];
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const url = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/twilio`
    : `${req.headers["x-forwarded-proto"]}://${req.headers.host}/api/twilio`;

  //   const isValidRequest = twilio.validateRequest(
  //     authToken,
  //     twilioSignature as string,
  //     url,
  //     req.body
  //   );

  //   if (!isValidRequest) {
  //     res.status(401).json({ error: "Invalid signature" });
  //     return;
  //   }

  // Get the incoming message and sender
  const incomingMsg = req.body.Body;
  const from = req.body.From; // This will be the WhatsApp number

  console.log("Received message:", incomingMsg, "from:", from);

  // Parse command and arguments
  const [command, ...args] = incomingMsg.trim().split(" ");

  // Handle the game command
  const response = await handleGameCommand(from, command, args);

  // Send response back through Twilio
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(response);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
};

export default twilioWebhook;

/*
curl -X POST http://localhost:3000/api/twilio -d "Body=join" -d "From=whatsapp:+1234567890"
*/
