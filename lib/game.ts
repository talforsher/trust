import { Redis } from "@upstash/redis";
import Fuse from "fuse.js";
import {
  isValidLanguage,
  getTranslation,
  getAvailableLanguages,
  SupportedLanguage,
} from "./languages";

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
  CREATE: "create",
  ATTACK: "attack",
  COLLECT: "collect",
  ALLIANCE: "alliance",
  STATUS: "status",
  HELP: "help",
  REGISTER: "register",
  LIST_PLAYERS: "players",
  DEFEND: "defend",
  LEAVE: "leave",
  HISTORY: "history",
  CONFIG: "config",
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
  if (!config.name)
    throw new GameError("INVALID_CONFIG", "Game name is required");
  if (!config.duration || config.duration <= 0)
    throw new GameError("INVALID_CONFIG", "Invalid game duration");
  if (!config.maxPlayers || config.maxPlayers <= 1)
    throw new GameError("INVALID_CONFIG", "Invalid max players");

  return {
    id: config.id,
    name: config.name,
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
  name: string;
  duration: number; // Game duration in seconds
  maxPlayers: number;
  startingResources: number;
  startingDefense: number;
  startingAttack: number;
  createdAt: number;
  hostId: string;
}

export interface GameData {
  config: GameConfig;
  players: Record<string, PlayerState>;
  status: "pending" | "active" | "completed";
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
  successfulBattles: number;
  language: string;
  messageHistory: string[]; // Store last 5 messages
  lastMessage?: string; // Store the last message for "." command
}

export const getGameData = async (gameId: string): Promise<GameData | null> => {
  return await redis.get<GameData>(`game:${gameId}`);
};

export const saveGameData = async (
  gameId: string,
  data: GameData
): Promise<void> => {
  await redis.set(`game:${gameId}`, data);
};

export const getPlayerState = async (
  playerId: string
): Promise<PlayerState> => {
  // First try to find the player's standalone state
  const playerState = await redis.get<PlayerState>(`player:${playerId}`);
  if (playerState) {
    return playerState;
  }

  // Then try to find the player in any game
  const gameKeys = await redis.keys("game:*");
  for (const gameKey of gameKeys) {
    const gameData = await redis.get<GameData>(gameKey);
    if (
      gameData?.players &&
      typeof gameData.players === "object" &&
      playerId in gameData.players
    ) {
      return gameData.players[playerId];
    }
  }

  // If not found, return default state
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
    language: "en",
    messageHistory: [],
  };
};

export const savePlayerState = async (playerId: string, state: PlayerState) => {
  if (!state.gameId) {
    // For players not in a game, store their state directly
    await redis.set(`player:${playerId}`, state);
    return;
  }

  const gameData = await getGameData(state.gameId);
  if (!gameData) {
    throw new GameError("GAME_NOT_FOUND", "Game not found");
  }

  gameData.players[playerId] = state;
  await saveGameData(state.gameId, gameData);
};

export const getAllPlayers = async (): Promise<PlayerState[]> => {
  const gameKeys = await redis.keys("game:*");
  const allPlayers: PlayerState[] = [];

  for (const gameKey of gameKeys) {
    const gameData = await redis.get<GameData>(gameKey);
    if (gameData?.players) {
      allPlayers.push(...Object.values(gameData.players));
    }
  }

  return allPlayers;
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

const handleHelpCommand = async (): Promise<string> => {
  let helpMessage =
    "*Available Commands:*\n" +
    "• *register <n>*: Set your player name\n" +
    "• *create <n>*: Create a new game\n" +
    "• *join <game_id>*: Join a game\n" +
    "• *attack <player>*: Attack another player\n" +
    "• *defend*: Boost your defense\n" +
    "• *collect*: Gather resources\n" +
    "• *alliance <player>*: Propose alliance\n" +
    "• *status*: Check your status\n" +
    "• *players*: List all players\n" +
    "• *leave*: Leave current game\n" +
    "• *config lang <language>*: Set your language";

  return formatMessage(helpMessage);
};

const configInstructions = (): string => {
  let instructions = "• *config <language>*: Set your language\n";
  return formatMessage(instructions);
};

// Generate a random 5-digit game ID
const generateGameId = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const handleGameCommand = async (
  playerId: string,
  command: string,
  args: string[]
): Promise<string> => {
  const state = await getPlayerState(playerId);
  const now = Math.floor(Date.now() / 1000);
  const players = await getAllPlayers();

  // Handle "." command to repeat last message
  if (command === ".") {
    if (!state.lastMessage) {
      return formatMessage("No previous command to repeat!");
    }
    const [lastCommand, ...lastArgs] = state.lastMessage.split(" ");
    return handleGameCommand(playerId, lastCommand, lastArgs);
  }

  // Store the command in message history
  const fullCommand = [command, ...args].join(" ");
  updateMessageHistory(state, fullCommand);
  await savePlayerState(playerId, state);

  // Check for recovery boost
  await checkAndApplyRecovery(state);

  // Match the command using fuzzy search
  const matchedCommand = matchCommand(command.toLowerCase());
  if (!matchedCommand) {
    return handleHelpCommand();
  }

  // Add message history command
  if (matchedCommand === "history") {
    if (state.messageHistory.length === 0) {
      return formatMessage("No command history available.");
    }
    const history = state.messageHistory
      .map((msg, i) => `${i + 1}. ${msg}`)
      .join("\n");
    return formatMessage(
      `Your last ${state.messageHistory.length} commands:\n${history}`
    );
  }

  // Regular game commands
  switch (matchedCommand) {
    case COMMANDS.ATTACK:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      if (args.length === 0)
        return formatMessage("Please provide a player to attack!");
      const targetPlayer = await findPlayerByName(args[0]);
      if (!targetPlayer)
        return formatMessage("Player not found! Please try again.");
      const { damage, stolenCoins } = calculateDamage(state, targetPlayer);
      state.resources += stolenCoins;
      targetPlayer.resources -= damage;
      await savePlayerState(playerId, state);
      await savePlayerState(targetPlayer.id, targetPlayer);
      return formatMessage(`*Attack successful!* ${damage} coins stolen.`);

    case COMMANDS.REGISTER:
      if (state.registered) return formatMessage("You are already registered!");
      if (args.length === 0) return formatMessage("Please provide your name!");
      state.name = args.join(" ");
      state.registered = true;
      await savePlayerState(playerId, state);
      return formatMessage(
        `*Welcome ${state.name}!* You've been registered successfully. Type 'join <game_id>' to join a game!`
      );

    case COMMANDS.CREATE:
      if (!state.registered)
        return formatMessage(
          "Please register first using 'register <your_name>'"
        );
      if (args.length === 0)
        return formatMessage("Please provide a name for the game!");

      const gameName = args.join(" ");
      const newGameId = generateGameId();
      const newGameData: GameData = {
        config: {
          id: newGameId,
          name: gameName,
          duration: 24 * 3600, // 24 hours
          maxPlayers: 10,
          startingResources: GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES,
          startingDefense: GAME_CONSTANTS.DEFAULT_DEFENSE_POINTS,
          startingAttack: GAME_CONSTANTS.DEFAULT_ATTACK_POWER,
          createdAt: now,
          hostId: playerId,
        },
        players: {},
        status: "active",
      };

      // Set up the player's state for the new game
      state.gameId = newGameId;
      state.resources = newGameData.config.startingResources;
      state.defensePoints = newGameData.config.startingDefense;
      state.attackPower = newGameData.config.startingAttack;

      // Add player to game data
      newGameData.players[playerId] = state;

      // Save the new game
      await saveGameData(newGameId, newGameData);

      return formatMessage(
        `*Game Created!*\nGame '${gameName}' created with ID: ${newGameId}\n\n` +
          "🎮 *Available Commands:*\n" +
          "• *attack <player>*: Attack another player\n" +
          "• *defend*: Boost your defense\n" +
          "• *collect*: Gather resources\n" +
          "• *alliance <player>*: Propose alliance\n" +
          "• *status*: Check your status\n" +
          "• *players*: List all players\n" +
          "• *leave*: Leave the game"
      );

    case COMMANDS.JOIN:
      if (!state.registered)
        return formatMessage(
          "Please register first using 'register <your_name>'"
        );
      if (args.length === 0)
        return formatMessage("Please provide a game ID to join!");

      const gameId = args[0];
      const gameData = await getGameData(gameId);

      if (!gameData) {
        return formatMessage(
          "Game not found! Use 'create <name>' to create a new game."
        );
      }

      // Ensure players object exists
      if (!gameData.players) {
        gameData.players = {};
      }

      const gamePlayers = Object.values(gameData.players);
      if (gamePlayers.length >= gameData.config.maxPlayers)
        return formatMessage("Game is full!");

      state.gameId = gameId;
      state.resources = gameData.config.startingResources;
      state.defensePoints = gameData.config.startingDefense;
      state.attackPower = gameData.config.startingAttack;

      // Add player to game data
      gameData.players[playerId] = state;
      await saveGameData(gameId, gameData);

      return formatMessage(
        `*Welcome to ${gameData.config.name}!*\n\n` +
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

    case COMMANDS.LIST_PLAYERS:
      const playerList = players.map((p) => `• ${p.name}`).join("\n");
      return formatMessage(`*Players in the game:*\n${playerList}`);

    case COMMANDS.COLLECT:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      const collectionAmount = calculateCollection(state);
      state.resources += collectionAmount;
      state.lastCollect = now;
      await savePlayerState(playerId, state);
      return formatMessage(`*Collected ${collectionAmount} coins!*`);

    case COMMANDS.ALLIANCE:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      if (args.length === 0)
        return formatMessage("Please provide a player to propose alliance!");
      const allianceTarget = await findPlayerByName(args[0]);
      if (!allianceTarget)
        return formatMessage("Player not found! Please try again.");

      state.pendingAlliances.push(allianceTarget.id);
      await savePlayerState(playerId, state);
      return formatMessage(
        `*Alliance proposal sent to ${allianceTarget.name}!*`
      );

    case COMMANDS.STATUS:
      return formatMessage(
        `*Status:*\n` +
          `• Name: ${state.name}\n` +
          `• Game ID: ${state.gameId}\n` +
          `• Resources: ${state.resources}\n` +
          `• Defense: ${state.defensePoints}\n` +
          `• Attack: ${state.attackPower}\n` +
          `• Level: ${state.level}`
      );

    case COMMANDS.LEAVE:
      if (!state.registered || !state.gameId)
        return formatMessage("Please join a game first!");
      state.gameId = "";
      await savePlayerState(playerId, state);
      return formatMessage("*You have left the game.*");

    case COMMANDS.CONFIG:
      if (args.length < 2 || args[0] !== "lang") {
        return formatMessage(configInstructions());
      }
      const newLang = args[1].toLowerCase();
      if (!isValidLanguage(newLang)) {
        return formatMessage(
          getTranslation("en", "invalid_language", {
            languages: getAvailableLanguages(),
          })
        );
      }
      state.language = newLang;
      await savePlayerState(playerId, state);
      return formatMessage(
        getTranslation(newLang as SupportedLanguage, "language_updated", {
          language: newLang,
        })
      );

    case COMMANDS.HELP:
      return handleHelpCommand();

    default:
      return handleHelpCommand();
  }
};

// Add a function to update message history
const updateMessageHistory = (state: PlayerState, message: string): void => {
  if (message !== ".") {
    state.lastMessage = message;
    state.messageHistory.unshift(message);
    if (state.messageHistory.length > 5) {
      state.messageHistory.pop();
    }
  }
};
