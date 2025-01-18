import { ICommand, CommandConstructor } from "./ICommand";

export class CommandFactory {
  private static instance: CommandFactory;
  private commands: Map<string, ICommand> = new Map();

  private constructor() {}

  static getInstance(): CommandFactory {
    if (!CommandFactory.instance) {
      CommandFactory.instance = new CommandFactory();
    }
    return CommandFactory.instance;
  }

  registerCommand(commandName: string, CommandClass: CommandConstructor) {
    this.commands.set(commandName.toLowerCase(), new CommandClass());
  }

  async executeCommand(
    from: string,
    commandName: string,
    args: string[]
  ): Promise<string> {
    const command = this.commands.get(commandName.toLowerCase());
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    return command.execute(from, args);
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
