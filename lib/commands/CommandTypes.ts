export const COMMANDS = {
  HELP: "help",
  REGISTER: "register",
  CREATE: "create",
  JOIN: "join",
  ATTACK: "attack",
  DEFEND: "defend",
  COLLECT: "collect",
  ALLIANCE: "alliance",
  STATUS: "status",
  LIST_PLAYERS: "players",
  LEAVE: "leave",
  CONFIG: "config",
} as const;

export type CommandType = (typeof COMMANDS)[keyof typeof COMMANDS];
