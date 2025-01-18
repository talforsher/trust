export interface ICommand {
  execute(from: string, args: string[]): Promise<string>;
}

export interface CommandConstructor {
  new (): ICommand;
}
