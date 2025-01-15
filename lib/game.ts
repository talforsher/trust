import { Redis } from "@upstash/redis";
import Fuse from "fuse.js";

const redis = Redis.fromEnv();

/**
 * Custom error class for game-specific errors
 */
export class GameError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "GameError";
  }
}

/**
 * Type-safe game commands enum
 */
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

export type GameCommand = keyof typeof COMMANDS;
export type CommandHandler = (
  state: PlayerState,
  args: string[]
) => Promise<string>;

/**
 * Input validation utilities
 */
export const validateGameConfig = (config: Partial<GameConfig>): GameConfig => {
  if (!config.id) throw new GameError("INVALID_CONFIG", "Game ID is required");
  if (!config.duration || config.duration <= 0)
    throw new GameError("INVALID_CONFIG", "Invalid game duration");
  if (!config.maxPlayers || config.maxPlayers <= 1)
    throw new GameError("INVALID_CONFIG", "Invalid max players");

  return {
    id: config.id,
    duration: config.duration,
    maxPlayers: config.maxPlayers,
    startingResources:
      config.startingResources ?? GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES,
    startingDefense:
      config.startingDefense ?? GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS,
    startingAttack:
      config.startingAttack ?? GAME_CONSTANTS.DEFAULT_ATTACK_POWER,
    createdAt: config.createdAt ?? Math.floor(Date.now() / 1000),
    hostId: config.hostId ?? "",
  };
};

export const validatePlayerState = (state: Partial<PlayerState>): void => {
  if (!state.id) throw new GameError("INVALID_STATE", "Player ID is required");
  if (state.resources !== undefined && state.resources < 0)
    throw new GameError("INVALID_STATE", "Resources cannot be negative");
  if (state.level !== undefined && state.level < 1)
    throw new GameError("INVALID_STATE", "Level must be at least 1");
};

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
    // Add this line to handle non-admin commands for admin users
    return formatMessage("Unknown admin command");
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

    default:
      return formatMessage(
        "Unknown command. Type 'help' for available commands."
      );
  }
};
