export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  he: "עברית",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return lang in SUPPORTED_LANGUAGES;
}

type TranslationKey = "welcome" | "invalid_language" | "language_updated";

type TranslationSet = {
  [key in TranslationKey]: string;
};

// Basic translations for game messages
export const TRANSLATIONS: Record<SupportedLanguage, TranslationSet> = {
  en: {
    welcome: "Welcome to the game!",
    invalid_language: "Invalid language. Please choose from: {languages}",
    language_updated: "Language updated to {language}",
  },
  es: {
    welcome: "¡Bienvenido al juego!",
    invalid_language: "Idioma no válido. Por favor elige entre: {languages}",
    language_updated: "Idioma actualizado a {language}",
  },
  fr: {
    welcome: "Bienvenue dans le jeu!",
    invalid_language: "Langue invalide. Veuillez choisir parmi: {languages}",
    language_updated: "Langue mise à jour en {language}",
  },
  de: {
    welcome: "Willkommen im Spiel!",
    invalid_language: "Ungültige Sprache. Bitte wählen Sie aus: {languages}",
    language_updated: "Sprache aktualisiert auf {language}",
  },
  it: {
    welcome: "Benvenuto nel gioco!",
    invalid_language: "Lingua non valida. Scegli tra: {languages}",
    language_updated: "Lingua aggiornata a {language}",
  },
  pt: {
    welcome: "Bem-vindo ao jogo!",
    invalid_language: "Idioma inválido. Por favor escolha entre: {languages}",
    language_updated: "Idioma atualizado para {language}",
  },
  ru: {
    welcome: "Добро пожаловать в игру!",
    invalid_language: "Неверный язык. Пожалуйста, выберите из: {languages}",
    language_updated: "Язык обновлен на {language}",
  },
  zh: {
    welcome: "欢迎来到游戏！",
    invalid_language: "无效的语言。请从以下选择：{languages}",
    language_updated: "语言已更新为 {language}",
  },
  ja: {
    welcome: "ゲームへようこそ！",
    invalid_language: "無効な言語です。以下から選択してください：{languages}",
    language_updated: "言語が {language} に更新されました",
  },
  ko: {
    welcome: "게임에 오신 것을 환영합니다!",
    invalid_language: "잘못된 언어입니다. 다음 중에서 선택하세요: {languages}",
    language_updated: "언어가 {language}로 업데이트되었습니다",
  },
  he: {
    welcome: "!ברוכים הבאים למשחק",
    invalid_language: "{languages} :שפה לא חוקית. אנא בחר מתוך",
    language_updated: "{language}-השפה עודכנה ל",
  },
} as const;

export function getTranslation(
  lang: SupportedLanguage,
  key: TranslationKey,
  params: Record<string, string> = {}
): string {
  const translation = TRANSLATIONS[lang][key];
  return translation.replace(
    /\{(\w+)\}/g,
    (_match: string, param: string) => params[param] || `{${param}}`
  );
}

export function getAvailableLanguages(): string {
  return Object.entries(SUPPORTED_LANGUAGES)
    .map(([code, name]) => `${code} (${name})`)
    .join(", ");
}
