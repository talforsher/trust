import { ICommand } from "./ICommand";
import { getPlayerState, savePlayerState, formatMessage } from "../game";
import {
  isValidLanguage,
  getAvailableLanguages,
  TRANSLATIONS,
  SupportedLanguage,
} from "../languages";

export class ConfigCommand implements ICommand {
  async execute(from: string, args: string[]): Promise<string> {
    if (args.length < 2 || args[0] !== "lang") {
      return formatMessage(
        "*Available Configurations:*\n" +
          "• *config lang <language>*: Set your language"
      );
    }

    const state = await getPlayerState(from);
    const newLang = args[1].toLowerCase();

    if (!isValidLanguage(newLang)) {
      return formatMessage(
        `Invalid language. Please choose from: ${getAvailableLanguages()}`
      );
    }

    state.language = newLang;
    await savePlayerState(from, state);

    return formatMessage(`Language updated to ${newLang}`);
  }
}
