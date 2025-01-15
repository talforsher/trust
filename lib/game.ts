import { Redis } from "@upstash/redis";
import Fuse from "fuse.js";

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
  DEFEND: "defend",
  LEAVE: "leave",
  // Admin commands
  DELETE_PLAYER: "delete",
  GIVE_RESOURCES: "give",
  SET_LEVEL: "setlevel",
  CREATE_GAME: "create_game",
} as const;

// Cooldown times (in seconds)
export const COOLDOWNS = {
  ATTACK: 21600, // 6 hours
  COLLECT: 600, // 10 minutes
  DEFENSE: 3600, // 1 hour
};

// Game constants
export const GAME_CONSTANTS = {
  WEAK_PLAYER_THRESHOLD: 0.5, // 50% of starting resources
  RECOVERY_INTERVAL: 86400, // 24 hours in seconds
  RECOVERY_BOOST_AMOUNT: 50, // Amount of resources to give weak players
  DEFAULT_STARTING_RESOURCES: 100,
  DEFAULT_DEFENSE_POINTS: 50,
  DEFAULT_ATTACK_POWER: 30,
};

export interface GameConfig {
  id: string;
  duration: number; // Game duration in seconds
  maxPlayers: number;
  startingResources: number;
  startingDefense: number;
  startingAttack: number;
  createdAt: number;
  hostId: string;
}

export interface PlayerState {
  id: string;
  name: string;
  gameId: string;
  resources: number;
  defensePoints: number;
  attackPower: number;
  lastAttack: number;
  lastCollect: number;
  lastDefense: number;
  lastRecoveryCheck: number;
  alliances: string[];
  pendingAlliances: string[];
  level: number;
  registered: boolean;
  isAdmin?: boolean;
  successfulBattles: number;
}

export const getPlayerState = async (
  playerId: string
): Promise<PlayerState> => {
  const state = await redis.get<PlayerState>(`player:${playerId}`);
  if (!state) {
    return {
      id: playerId,
      name: "",
      gameId: "",
      resources: GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES,
      defensePoints: GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS,
      attackPower: GAME_CONSTANTS.DEFAULT_ATTACK_POWER,
      lastAttack: 0,
      lastCollect: 0,
      lastDefense: 0,
      lastRecoveryCheck: 0,
      alliances: [],
      pendingAlliances: [],
      level: 1,
      registered: false,
      successfulBattles: 0,
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

// Calculate damage based on attacker's power and defender's defense
const calculateDamage = (
  attacker: PlayerState,
  defender: PlayerState
): { damage: number; stolenCoins: number } => {
  const rawDamage = Math.max(0, attacker.attackPower - defender.defensePoints);
  const levelMultiplier = attacker.level / defender.level;
  const damage = Math.floor(rawDamage * levelMultiplier);

  // Calculate stolen coins (10% of damage dealt)
  const stolenCoins = Math.floor(damage * 0.1);

  return { damage, stolenCoins };
};

// Check if player needs recovery boost
const checkAndApplyRecovery = async (
  player: PlayerState
): Promise<PlayerState> => {
  const now = Math.floor(Date.now() / 1000);

  // Only check once per recovery interval
  if (now - player.lastRecoveryCheck < GAME_CONSTANTS.RECOVERY_INTERVAL) {
    return player;
  }

  // Check if resources are below threshold
  if (
    player.resources <
    GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES *
      GAME_CONSTANTS.WEAK_PLAYER_THRESHOLD
  ) {
    player.resources += GAME_CONSTANTS.RECOVERY_BOOST_AMOUNT;
    player.defensePoints += Math.floor(
      GAME_CONSTANTS.RECOVERY_BOOST_AMOUNT / 2
    );
  }

  player.lastRecoveryCheck = now;
  return player;
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

// Enhanced findPlayerByName with fuzzy matching
export const findPlayerByName = async (
  name: string
): Promise<PlayerState | null> => {
  const players = await getAllPlayers();
  const registeredPlayers = players.filter((p) => p.registered);

  // Configure Fuse for player name matching
  const fuse = new Fuse(registeredPlayers, {
    keys: ["name"],
    threshold: 0.3,
    distance: 3,
  });

  const results = fuse.search(name);
  return results.length > 0 ? results[0].item : null;
};

// Helper function to match commands with fuzzy search
const matchCommand = (input: string): string | null => {
  const commandList = Object.values(COMMANDS);
  const fuse = new Fuse(commandList, {
    threshold: 0.3,
    distance: 3,
  });

  const results = fuse.search(input);
  return results.length > 0 ? results[0].item : null;
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

  // Check for recovery boost
  await checkAndApplyRecovery(state);

  // Match the command using fuzzy search
  const matchedCommand = matchCommand(command.toLowerCase());
  if (!matchedCommand) {
    return formatMessage(
      "Unknown command. Type 'help' for available commands."
    );
  }

  // Admin commands
  if (isAdmin(state)) {
    switch (matchedCommand) {
      case COMMANDS.CREATE_GAME:
        if (args.length < 3)
          return formatMessage(
            "Usage: create_game <game_id> <duration_hours> <max_players>"
          );
        const gameConfig: GameConfig = {
          id: args[0],
          duration: parseInt(args[1]) * 3600, // Convert hours to seconds
          maxPlayers: parseInt(args[2]),
          startingResources: GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES,
          startingDefense: GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS,
          startingAttack: GAME_CONSTANTS.DEFAULT_ATTACK_POWER,
          createdAt: now,
          hostId: playerId,
        };
        await redis.set(`game:${gameConfig.id}`, gameConfig);
        return formatMessage(`Game ${gameConfig.id} created successfully!`);

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
  switch (matchedCommand) {
    case COMMANDS.REGISTER:
      if (state.registered) return formatMessage("You are already registered!");
      if (args.length === 0) return formatMessage("Please provide your name!");
      state.name = args.join(" ");
      state.registered = true;
      await savePlayerState(playerId, state);
      return formatMessage(
        `*Welcome ${state.name}!* You've been registered successfully. Type 'join <game_id>' to join a game!`
      );

    case COMMANDS.JOIN:
      if (!state.registered)
        return formatMessage(
          "Please register first using 'register <your_name>'"
        );
      if (args.length === 0)
        return formatMessage("Please provide a game ID to join!");

      const gameId = args[0];
      const targetGame = await redis.get<GameConfig>(`game:${gameId}`);
      if (!targetGame) return formatMessage("Game not found!");

      const players = await getAllPlayers();
      const gamePlayers = players.filter((p) => p.gameId === gameId);
      if (gamePlayers.length >= targetGame.maxPlayers)
        return formatMessage("Game is full!");

      state.gameId = gameId;
      state.resources = targetGame.startingResources;
      state.defensePoints = targetGame.startingDefense;
      state.attackPower = targetGame.startingAttack;
      await savePlayerState(playerId, state);

      return formatMessage(
        "*Welcome to Alliance Wars!*\n\n" +
          "🎮 *Available Commands:*\n" +
          "• *attack <player>*: Attack another player\n" +
          "• *defend*: Boost your defense\n" +
          "• *collect*: Gather resources\n" +
          "• *alliance <player>*: Propose alliance\n" +
          "• *status*: Check your status\n" +
          "• *players*: List all players\n" +
          "• *leave*: Leave the game"
      );

    case COMMANDS.DEFEND:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      if (now - state.lastDefense < COOLDOWNS.DEFENSE) {
        return formatMessage(
          `⏳ Defense Cooldown: ${
            COOLDOWNS.DEFENSE - (now - state.lastDefense)
          } seconds remaining`
        );
      }

      const defenseBoost = Math.floor(state.level * 5);
      state.defensePoints += defenseBoost;
      state.lastDefense = now;
      await savePlayerState(playerId, state);

      return formatMessage(
        `🛡️ *Defense Boosted!*\n` +
          `• Boost amount: ${defenseBoost}\n` +
          `• Total defense: ${state.defensePoints}`
      );

    case COMMANDS.ATTACK:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      if (args.length === 0)
        return formatMessage("Please specify a player name to attack!");
      if (now - state.lastAttack < COOLDOWNS.ATTACK) {
        return formatMessage(
          `⏳ Attack Cooldown: ${
            COOLDOWNS.ATTACK - (now - state.lastAttack)
          } seconds remaining`
        );
      }

      const targetName = args.join(" ");
      const targetPlayer = await findPlayerByName(targetName);

      if (!targetPlayer) {
        return formatMessage("Could not find a player with that name!");
      }

      if (targetPlayer.id === playerId) {
        return formatMessage("You cannot attack yourself!");
      }

      if (state.alliances.includes(targetPlayer.id)) {
        return formatMessage("You cannot attack your ally!");
      }

      const { damage, stolenCoins } = calculateDamage(state, targetPlayer);
      targetPlayer.resources = Math.max(
        0,
        targetPlayer.resources - stolenCoins
      );
      state.resources += stolenCoins;
      state.lastAttack = now;
      state.successfulBattles++;

      await savePlayerState(targetPlayer.id, targetPlayer);
      await savePlayerState(playerId, state);

      return formatMessage(
        `⚔️ *Attack Results:*\n` +
          `• Damage dealt: ${damage}\n` +
          `• Coins stolen: ${stolenCoins}\n` +
          `• ${targetPlayer.name}'s remaining resources: ${targetPlayer.resources}\n` +
          `• Your resources: ${state.resources}`
      );

    case COMMANDS.ALLIANCE:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      if (args.length === 0)
        return formatMessage(
          "Please specify a player name to propose an alliance!"
        );

      const allyName = args.join(" ");
      const allyPlayer = await findPlayerByName(allyName);
      if (!allyPlayer) {
        return formatMessage("Could not find a player with that name!");
      }

      if (allyPlayer.id === playerId) {
        return formatMessage("You cannot form an alliance with yourself!");
      }

      if (state.alliances.includes(allyPlayer.id)) {
        return formatMessage("You are already allied with this player!");
      }

      // Check if both players have proposed to each other
      if (allyPlayer.pendingAlliances.includes(state.id)) {
        // Form the alliance
        state.alliances.push(allyPlayer.id);
        allyPlayer.alliances.push(state.id);
        // Clear pending proposals
        state.pendingAlliances = state.pendingAlliances.filter(
          (id) => id !== allyPlayer.id
        );
        allyPlayer.pendingAlliances = allyPlayer.pendingAlliances.filter(
          (id) => id !== state.id
        );
        await savePlayerState(allyPlayer.id, allyPlayer);
        await savePlayerState(playerId, state);
        return formatMessage(
          `🤝 *Alliance Formed!*\n` +
            `• You are now allied with ${allyPlayer.name}!\n` +
            `• You can share resources and coordinate attacks.`
        );
      } else {
        // Add pending alliance
        state.pendingAlliances.push(allyPlayer.id);
        await savePlayerState(playerId, state);
        return formatMessage(
          `🤝 *Alliance Proposal:*\n` +
            `• You have proposed an alliance with ${allyPlayer.name}!\n` +
            `• Waiting for them to accept.`
        );
      }

    case COMMANDS.LEAVE:
      if (!state.registered || !state.gameId)
        return formatMessage("You are not in a game!");

      state.gameId = "";
      state.resources = GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES;
      state.defensePoints = GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS;
      state.attackPower = GAME_CONSTANTS.DEFAULT_ATTACK_POWER;
      state.alliances = [];
      state.pendingAlliances = [];
      await savePlayerState(playerId, state);

      return formatMessage(
        "You have left the game. Join another one with 'join <game_id>'!"
      );

    case COMMANDS.STATUS:
      if (!state.registered) return formatMessage("Please register first!");
      if (!state.gameId) return formatMessage("Please join a game first!");

      const currentGame = await redis.get<GameConfig>(`game:${state.gameId}`);
      const timeLeft = currentGame
        ? Math.max(0, currentGame.createdAt + currentGame.duration - now)
        : 0;

      return formatMessage(
        `📊 *Player Status:*\n` +
          `• Name: ${state.name}\n` +
          `• Level: ${state.level}\n` +
          `• Resources: ${state.resources}\n` +
          `• Defense Points: ${state.defensePoints}\n` +
          `• Attack Power: ${state.attackPower}\n` +
          `• Successful Battles: ${state.successfulBattles}\n` +
          `• Game Time Left: ${Math.floor(timeLeft / 3600)}h ${Math.floor(
            (timeLeft % 3600) / 60
          )}m\n` +
          `• Alliances: ${
            state.alliances.length ? state.alliances.join(", ") : "None"
          }\n` +
          `• Pending Alliances: ${
            state.pendingAlliances.length
              ? state.pendingAlliances.join(", ")
              : "None"
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
          }\n` +
          `• Defense: ${
            now - state.lastDefense >= COOLDOWNS.DEFENSE
              ? "✅ Ready"
              : "⏳ Cooling down"
          }`
      );

    case COMMANDS.HELP:
      let helpMessage =
        "*Available Commands:*\n" +
        "• *register <name>*: Set your player name\n" +
        "• *join <game_id>*: Join a game\n" +
        "• *attack <player>*: Attack another player\n" +
        "• *defend*: Boost your defense\n" +
        "• *collect*: Gather resources\n" +
        "• *alliance <player>*: Propose alliance\n" +
        "• *status*: Check your status\n" +
        "• *players*: List all players\n" +
        "• *leave*: Leave current game";

      if (isAdmin(state)) {
        helpMessage +=
          "\n\n*Admin Commands:*\n" +
          "• *create_game <game_id> <duration_hours> <max_players>*: Create a new game\n" +
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
