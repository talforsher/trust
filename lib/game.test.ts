import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  validateGameConfig,
  validatePlayerState,
  GameError,
  GAME_CONSTANTS,
} from "./game";

// Mock Redis
jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      get: jest.fn().mockImplementation(() => Promise.resolve(null)),
      set: jest.fn().mockImplementation(() => Promise.resolve("OK")),
      del: jest.fn().mockImplementation(() => Promise.resolve(1)),
      keys: jest.fn().mockImplementation(() => Promise.resolve([])),
      mget: jest.fn().mockImplementation(() => Promise.resolve([])),
    }),
  },
}));

describe("Game Validation", () => {
  describe("validateGameConfig", () => {
    it("should validate a correct game config", () => {
      const config = {
        id: "test-game",
        duration: 3600,
        maxPlayers: 10,
        hostId: "host-1",
      };

      const validatedConfig = validateGameConfig(config);
      expect(validatedConfig.id).toBe(config.id);
      expect(validatedConfig.duration).toBe(config.duration);
      expect(validatedConfig.maxPlayers).toBe(config.maxPlayers);
      expect(validatedConfig.startingResources).toBe(
        GAME_CONSTANTS.DEFAULT_STARTING_RESOURCES
      );
    });

    it("should throw error for invalid duration", () => {
      const config = {
        id: "test-game",
        duration: -1,
        maxPlayers: 10,
      };

      expect(() => validateGameConfig(config)).toThrow(GameError);
    });

    it("should throw error for invalid max players", () => {
      const config = {
        id: "test-game",
        duration: 3600,
        maxPlayers: 0,
      };

      expect(() => validateGameConfig(config)).toThrow(GameError);
    });
  });

  describe("validatePlayerState", () => {
    it("should validate correct player state", () => {
      const state = {
        id: "player-1",
        resources: 100,
        level: 1,
      };

      expect(() => validatePlayerState(state)).not.toThrow();
    });

    it("should throw error for negative resources", () => {
      const state = {
        id: "player-1",
        resources: -10,
        level: 1,
      };

      expect(() => validatePlayerState(state)).toThrow(GameError);
    });

    it("should throw error for invalid level", () => {
      const state = {
        id: "player-1",
        resources: 100,
        level: 0,
      };

      expect(() => validatePlayerState(state)).toThrow(GameError);
    });
  });
});
