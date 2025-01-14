import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Game commands
export const COMMANDS = {
  JOIN: "join",
  ATTACK: "attack",
  COLLECT: "collect",
  ALLIANCE: "alliance",
  STATUS: "status",
  HELP: "help",
  REGISTER: "register",
  LIST_PLAYERS: "players",
  // Admin commands
  DELETE_PLAYER: "delete",
  GIVE_RESOURCES: "give",
  SET_LEVEL: "setlevel",
} as const;

// Cooldown times (in seconds)
export const COOLDOWNS = {
  ATTACK: 300, // 5 minutes
  COLLECT: 600, // 10 minutes
};

export interface PlayerState {
  id: string;
  name: string;
  resources: number;
  lastAttack: number;
  lastCollect: number;
  alliances: string[];
  level: number;
  registered: boolean;
  isAdmin?: boolean;
}

export const getPlayerState = async (
  playerId: string
): Promise<PlayerState> => {
  const state = await redis.get<PlayerState>(`player:${playerId}`);
  if (!state) {
    return {
      id: playerId,
      name: "",
      resources: 100,
      lastAttack: 0,
      lastCollect: 0,
      alliances: [],
      level: 1,
      registered: false,
    };
  }
  return state;
};

export const savePlayerState = async (playerId: string, state: PlayerState) => {
  await redis.set(`player:${playerId}`, state);
};

export const getAllPlayers = async (): Promise<PlayerState[]> => {
  const keys = await redis.keys("player:*");
  const players = await Promise.all(
    keys.map(async (key) => await redis.get<PlayerState>(key))
  );
  return players.filter((p): p is PlayerState => p !== null);
};

// Calculate damage based on player levels and resources
const calculateDamage = (
  attacker: PlayerState,
  defender: PlayerState
): number => {
  const baseDamage = 10;
  const levelMultiplier = attacker.level / defender.level;
  const resourceFactor = Math.min(attacker.resources / 100, 2); // Cap resource bonus at 2x
  return Math.floor(baseDamage * levelMultiplier * resourceFactor);
};

// Calculate resource collection based on player level
const calculateCollection = (player: PlayerState): number => {
  const baseCollection = 15;
  const levelBonus = player.level * 2;
  return baseCollection + levelBonus;
};

export const formatMessage = (message: string): string => {
  // Add some basic WhatsApp-compatible formatting
  return message
    .replace(/\*(.*?)\*/g, "*$1*") // Bold
    .replace(/_(.*?)_/g, "_$1_") // Italic
    .replace(/~(.*?)~/g, "~$1~") // Strikethrough
    .replace(/```(.*?)```/g, "```$1```"); // Code block
};

// Helper function to find a player by name
export const findPlayerByName = async (
  name: string
): Promise<PlayerState | null> => {
  const players = await getAllPlayers();
  return (
    players.find(
      (p) => p.registered && p.name.toLowerCase() === name.toLowerCase()
    ) || null
  );
};

// Helper function to check admin status
const isAdmin = (state: PlayerState): boolean => {
  return !!state.isAdmin;
};

export const handleGameCommand = async (
  playerId: string,
  command: string,
  args: string[]
): Promise<string> => {
  const state = await getPlayerState(playerId);
  const now = Math.floor(Date.now() / 1000);

  // Admin commands
  if (isAdmin(state)) {
    switch (command.toLowerCase()) {
      case COMMANDS.DELETE_PLAYER:
        if (args.length === 0)
          return formatMessage("Please specify a player name!");
        const playerToDelete = await findPlayerByName(args.join(" "));
        if (!playerToDelete) return formatMessage("Player not found!");
        await redis.del(`player:${playerToDelete.id}`);
        return formatMessage(`Player ${playerToDelete.name} has been deleted!`);

      case COMMANDS.GIVE_RESOURCES:
        if (args.length < 2)
          return formatMessage("Usage: give <player> <amount>");
        const targetPlayer = await findPlayerByName(args[0]);
        if (!targetPlayer) return formatMessage("Player not found!");
        const amount = parseInt(args[1]);
        if (isNaN(amount)) return formatMessage("Invalid amount!");
        targetPlayer.resources += amount;
        await savePlayerState(targetPlayer.id, targetPlayer);
        return formatMessage(
          `Gave ${amount} resources to ${targetPlayer.name}`
        );

      case COMMANDS.SET_LEVEL:
        if (args.length < 2)
          return formatMessage("Usage: setlevel <player> <level>");
        const levelTarget = await findPlayerByName(args[0]);
        if (!levelTarget) return formatMessage("Player not found!");
        const level = parseInt(args[1]);
        if (isNaN(level) || level < 1) return formatMessage("Invalid level!");
        levelTarget.level = level;
        await savePlayerState(levelTarget.id, levelTarget);
        return formatMessage(`Set ${levelTarget.name}'s level to ${level}`);
    }
  }

  // Regular game commands
  switch (command.toLowerCase()) {
    case COMMANDS.REGISTER:
      if (state.registered) return formatMessage("You are already registered!");
      if (args.length === 0) return formatMessage("Please provide your name!");
      state.name = args.join(" ");
      state.registered = true;
      await savePlayerState(playerId, state);
      return formatMessage(
        `*Welcome ${state.name}!* You've been registered successfully. Type 'join' to start playing!`
      );

    case COMMANDS.JOIN:
      if (!state.registered)
        return formatMessage(
          "Please register first using 'register <your_name>'"
        );
      await savePlayerState(playerId, state);
      return formatMessage(
        "*Welcome to Alliance Wars!*\n\n" +
          "🎮 *Available Commands:*\n" +
          "• *register <name>*: Set your player name\n" +
          "• *attack <player>*: Attack another player\n" +
          "• *collect*: Gather resources\n" +
          "• *alliance <player>*: Propose alliance\n" +
          "• *status*: Check your status\n" +
          "• *players*: List all players"
      );

    case COMMANDS.LIST_PLAYERS:
      const players = await getAllPlayers();
      return formatMessage(
        "*Available Players:*\n" +
          players
            .filter((p) => p.registered && p.id !== playerId)
            .map((p) => `• ${p.name} (Level ${p.level})`)
            .join("\n")
      );

    case COMMANDS.ATTACK:
      if (!state.registered) return formatMessage("Please register first!");
      if (args.length === 0)
        return formatMessage("Please specify a player name to attack!");
      if (now - state.lastAttack < COOLDOWNS.ATTACK) {
        return formatMessage(
          `⏳ Cooldown: ${
            COOLDOWNS.ATTACK - (now - state.lastAttack)
          } seconds remaining`
        );
      }

      const targetName = args.join(" "); // Allow names with spaces
      const targetPlayer = await findPlayerByName(targetName);

      if (!targetPlayer) {
        return formatMessage("Could not find a player with that name!");
      }

      const targetState = targetPlayer;

      if (targetState.id === playerId) {
        return formatMessage("You cannot attack yourself!");
      }

      const damage = calculateDamage(state, targetState);
      targetState.resources = Math.max(0, targetState.resources - damage);
      state.lastAttack = now;

      await savePlayerState(targetState.id, targetState);
      await savePlayerState(playerId, state);
      return formatMessage(
        `⚔️ *Attack Results:*\n` +
          `• Damage dealt: ${damage}\n` +
          `• ${targetState.name}'s resources: ${targetState.resources}`
      );

    case COMMANDS.COLLECT:
      if (!state.registered) return formatMessage("Please register first!");
      if (now - state.lastCollect < COOLDOWNS.COLLECT) {
        return formatMessage(
          `⏳ Cooldown: ${
            COOLDOWNS.COLLECT - (now - state.lastCollect)
          } seconds remaining`
        );
      }

      const collected = calculateCollection(state);
      state.resources += collected;
      state.lastCollect = now;
      await savePlayerState(playerId, state);
      return formatMessage(
        `💰 *Resources Collected!*\n` +
          `• Amount: ${collected}\n` +
          `• Total resources: ${state.resources}`
      );

    case COMMANDS.STATUS:
      if (!state.registered) return formatMessage("Please register first!");
      return formatMessage(
        `📊 *Player Status:*\n` +
          `• Name: ${state.name}\n` +
          `• Level: ${state.level}\n` +
          `• Resources: ${state.resources}\n` +
          `• Alliances: ${
            state.alliances.length ? state.alliances.join(", ") : "None"
          }\n` +
          `• Attack: ${
            now - state.lastAttack >= COOLDOWNS.ATTACK
              ? "✅ Ready"
              : "⏳ Cooling down"
          }\n` +
          `• Collect: ${
            now - state.lastCollect >= COOLDOWNS.COLLECT
              ? "✅ Ready"
              : "⏳ Cooling down"
          }`
      );

    case COMMANDS.ALLIANCE:
      if (!state.registered) return formatMessage("Please register first!");
      if (args.length === 0)
        return formatMessage(
          "Please specify a player name to propose an alliance!"
        );

      const allianceName = args.join(" "); // Allow names with spaces
      const alliancePlayer = await findPlayerByName(allianceName);

      if (!alliancePlayer) {
        return formatMessage("Could not find a player with that name!");
      }

      const allianceState = alliancePlayer;

      if (allianceState.id === playerId) {
        return formatMessage("You cannot propose an alliance with yourself!");
      }

      if (state.alliances.includes(allianceState.id)) {
        return formatMessage("You are already allied with this player!");
      }

      state.alliances.push(allianceState.id);
      await savePlayerState(playerId, state);
      return formatMessage(
        `🤝 *Alliance Proposal:*\n` +
          `• You have proposed an alliance with ${allianceState.name}!`
      );

    case COMMANDS.HELP:
      let helpMessage =
        "*Available Commands:*\n" +
        "• *register <name>*: Set your player name\n" +
        "• *attack <player>*: Attack another player\n" +
        "• *collect*: Gather resources\n" +
        "• *alliance <player>*: Propose alliance\n" +
        "• *status*: Check your status\n" +
        "• *players*: List all players";

      if (isAdmin(state)) {
        helpMessage +=
          "\n\n*Admin Commands:*\n" +
          "• *delete <player>*: Delete a player\n" +
          "• *give <player> <amount>*: Give resources to a player\n" +
          "• *setlevel <player> <level>*: Set a player's level";
      }

      return formatMessage(helpMessage);

    default:
      return formatMessage(
        "Unknown command. Type 'help' for available commands."
      );
  }
};
