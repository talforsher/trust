import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./languages";

/**
 * Types of messages that can be translated
 */
export type TranslationKey =
  | "welcome" // Welcome message
  | "invalid_language" // Invalid language selection error
  | "language_updated" // Language update confirmation
  | "help" // Help command description
  | "unknown_command" // Unknown command error
  | "game_started" // Game started message
  | "game_ended" // Game ended message
  | "invalid_move" // Invalid move error
  | "your_turn" // Player turn notification
  | "game_won" // Game won message
  | "game_draw" // Game draw message
  | "player_joined" // Player joined notification
  | "player_left" // Player left notification
  | "waiting_for_player" // Waiting for player message
  | "score_update"; // Score update message

/**
 * Available commands in the game
 */
export type CommandKey =
  | "help"
  | "start"
  | "stop"
  | "move"
  | "language"
  | "status"
  | "restart"
  | "quit";

/**
 * Structure for command help and usage information
 */
type CommandInfo = {
  description: string;
  usage: string;
};

/**
 * Complete translation set including messages and commands
 */
type TranslationSet = {
  messages: Record<TranslationKey, string>;
  commands: Record<CommandKey, CommandInfo>;
};

/**
 * Complete translations for all supported languages
 */
export const TRANSLATIONS: Record<SupportedLanguage, TranslationSet> = {
  en: {
    messages: {
      welcome: "Welcome to the game!",
      invalid_language: "Invalid language. Please choose from: {languages}",
      language_updated: "Language updated to {language}",
      help: "Available commands:",
      unknown_command: "Unknown command: {command}",
      game_started: "Game started! Good luck!",
      game_ended: "Game ended.",
      invalid_move: "Invalid move. Please try again.",
      your_turn: "It's your turn!",
      game_won: "{player} has won the game!",
      game_draw: "Game ended in a draw!",
      player_joined: "{player} has joined the game.",
      player_left: "{player} has left the game.",
      waiting_for_player: "Waiting for another player...",
      score_update: "Score: {score}",
    },
    commands: {
      help: {
        description: "Show available commands",
        usage: "/help",
      },
      start: {
        description: "Start a new game",
        usage: "/start",
      },
      stop: {
        description: "Stop the current game",
        usage: "/stop",
      },
      move: {
        description: "Make a move",
        usage: "/move <position>",
      },
      language: {
        description: "Change language",
        usage: "/language <code>",
      },
      status: {
        description: "Show game status",
        usage: "/status",
      },
      restart: {
        description: "Restart the game",
        usage: "/restart",
      },
      quit: {
        description: "Quit the game",
        usage: "/quit",
      },
    },
  },
  es: {
    messages: {
      welcome: "¡Bienvenido al juego!",
      invalid_language: "Idioma no válido. Por favor elige entre: {languages}",
      language_updated: "Idioma actualizado a {language}",
      help: "Comandos disponibles:",
      unknown_command: "Comando desconocido: {command}",
      game_started: "¡Juego iniciado! ¡Buena suerte!",
      game_ended: "Juego terminado.",
      invalid_move: "Movimiento inválido. Inténtalo de nuevo.",
      your_turn: "¡Es tu turno!",
      game_won: "¡{player} ha ganado el juego!",
      game_draw: "¡El juego terminó en empate!",
      player_joined: "{player} se ha unido al juego.",
      player_left: "{player} ha dejado el juego.",
      waiting_for_player: "Esperando a otro jugador...",
      score_update: "Puntuación: {score}",
    },
    commands: {
      help: {
        description: "Mostrar comandos disponibles",
        usage: "/ayuda",
      },
      start: {
        description: "Iniciar nuevo juego",
        usage: "/iniciar",
      },
      stop: {
        description: "Detener el juego actual",
        usage: "/detener",
      },
      move: {
        description: "Hacer un movimiento",
        usage: "/mover <posición>",
      },
      language: {
        description: "Cambiar idioma",
        usage: "/idioma <código>",
      },
      status: {
        description: "Mostrar estado del juego",
        usage: "/estado",
      },
      restart: {
        description: "Reiniciar el juego",
        usage: "/reiniciar",
      },
      quit: {
        description: "Salir del juego",
        usage: "/salir",
      },
    },
  },
  // Add similar structures for other languages...
  fr: {
    messages: {
      welcome: "Bienvenue dans le jeu!",
      invalid_language: "Langue invalide. Veuillez choisir parmi: {languages}",
      language_updated: "Langue mise à jour en {language}",
      help: "Commandes disponibles:",
      unknown_command: "Commande inconnue: {command}",
      game_started: "Partie commencée! Bonne chance!",
      game_ended: "Partie terminée.",
      invalid_move: "Mouvement invalide. Veuillez réessayer.",
      your_turn: "C'est votre tour!",
      game_won: "{player} a gagné la partie!",
      game_draw: "La partie se termine par une égalité!",
      player_joined: "{player} a rejoint la partie.",
      player_left: "{player} a quitté la partie.",
      waiting_for_player: "En attente d'un autre joueur...",
      score_update: "Score: {score}",
    },
    commands: {
      help: {
        description: "Afficher les commandes disponibles",
        usage: "/aide",
      },
      start: {
        description: "Commencer une nouvelle partie",
        usage: "/commencer",
      },
      stop: {
        description: "Arrêter la partie en cours",
        usage: "/arreter",
      },
      move: {
        description: "Faire un mouvement",
        usage: "/jouer <position>",
      },
      language: {
        description: "Changer de langue",
        usage: "/langue <code>",
      },
      status: {
        description: "Afficher l'état du jeu",
        usage: "/statut",
      },
      restart: {
        description: "Redémarrer la partie",
        usage: "/redemarrer",
      },
      quit: {
        description: "Quitter la partie",
        usage: "/quitter",
      },
    },
  },
  de: {
    messages: {
      welcome: "Willkommen im Spiel!",
      invalid_language: "Ungültige Sprache. Bitte wählen Sie aus: {languages}",
      language_updated: "Sprache aktualisiert auf {language}",
      help: "Verfügbare Befehle:",
      unknown_command: "Unbekannter Befehl: {command}",
      game_started: "Spiel gestartet! Viel Glück!",
      game_ended: "Spiel beendet.",
      invalid_move: "Ungültiger Zug. Bitte versuchen Sie es erneut.",
      your_turn: "Sie sind am Zug!",
      game_won: "{player} hat das Spiel gewonnen!",
      game_draw: "Das Spiel endet unentschieden!",
      player_joined: "{player} ist dem Spiel beigetreten.",
      player_left: "{player} hat das Spiel verlassen.",
      waiting_for_player: "Warten auf einen anderen Spieler...",
      score_update: "Punktestand: {score}",
    },
    commands: {
      help: {
        description: "Zeige verfügbare Befehle",
        usage: "/hilfe",
      },
      start: {
        description: "Neues Spiel starten",
        usage: "/start",
      },
      stop: {
        description: "Aktuelles Spiel beenden",
        usage: "/stop",
      },
      move: {
        description: "Einen Zug machen",
        usage: "/zug <position>",
      },
      language: {
        description: "Sprache ändern",
        usage: "/sprache <code>",
      },
      status: {
        description: "Spielstatus anzeigen",
        usage: "/status",
      },
      restart: {
        description: "Spiel neu starten",
        usage: "/neustart",
      },
      quit: {
        description: "Spiel verlassen",
        usage: "/verlassen",
      },
    },
  },
  it: {
    messages: {
      welcome: "Benvenuto nel gioco!",
      invalid_language: "Lingua non valida. Scegli tra: {languages}",
      language_updated: "Lingua aggiornata a {language}",
      help: "Comandi disponibili:",
      unknown_command: "Comando sconosciuto: {command}",
      game_started: "Partita iniziata! Buona fortuna!",
      game_ended: "Partita terminata.",
      invalid_move: "Mossa non valida. Riprova.",
      your_turn: "È il tuo turno!",
      game_won: "{player} ha vinto la partita!",
      game_draw: "La partita è finita in parità!",
      player_joined: "{player} si è unito alla partita.",
      player_left: "{player} ha lasciato la partita.",
      waiting_for_player: "In attesa di un altro giocatore...",
      score_update: "Punteggio: {score}",
    },
    commands: {
      help: {
        description: "Mostra comandi disponibili",
        usage: "/aiuto",
      },
      start: {
        description: "Inizia nuova partita",
        usage: "/inizia",
      },
      stop: {
        description: "Ferma la partita corrente",
        usage: "/ferma",
      },
      move: {
        description: "Fai una mossa",
        usage: "/mossa <posizione>",
      },
      language: {
        description: "Cambia lingua",
        usage: "/lingua <codice>",
      },
      status: {
        description: "Mostra stato partita",
        usage: "/stato",
      },
      restart: {
        description: "Riavvia la partita",
        usage: "/riavvia",
      },
      quit: {
        description: "Esci dalla partita",
        usage: "/esci",
      },
    },
  },
  pt: {
    messages: {
      welcome: "Bem-vindo ao jogo!",
      invalid_language: "Idioma inválido. Por favor escolha entre: {languages}",
      language_updated: "Idioma atualizado para {language}",
      help: "Comandos disponíveis:",
      unknown_command: "Comando desconhecido: {command}",
      game_started: "Jogo iniciado! Boa sorte!",
      game_ended: "Jogo terminado.",
      invalid_move: "Movimento inválido. Tente novamente.",
      your_turn: "É a sua vez!",
      game_won: "{player} venceu o jogo!",
      game_draw: "O jogo terminou em empate!",
      player_joined: "{player} entrou no jogo.",
      player_left: "{player} saiu do jogo.",
      waiting_for_player: "Aguardando outro jogador...",
      score_update: "Pontuação: {score}",
    },
    commands: {
      help: {
        description: "Mostrar comandos disponíveis",
        usage: "/ajuda",
      },
      start: {
        description: "Iniciar novo jogo",
        usage: "/iniciar",
      },
      stop: {
        description: "Parar jogo atual",
        usage: "/parar",
      },
      move: {
        description: "Fazer um movimento",
        usage: "/mover <posição>",
      },
      language: {
        description: "Mudar idioma",
        usage: "/idioma <código>",
      },
      status: {
        description: "Mostrar estado do jogo",
        usage: "/estado",
      },
      restart: {
        description: "Reiniciar o jogo",
        usage: "/reiniciar",
      },
      quit: {
        description: "Sair do jogo",
        usage: "/sair",
      },
    },
  },
  ru: {
    messages: {
      welcome: "Добро пожаловать в игру!",
      invalid_language: "Неверный язык. Пожалуйста, выберите из: {languages}",
      language_updated: "Язык обновлен на {language}",
      help: "Доступные команды:",
      unknown_command: "Неизвестная команда: {command}",
      game_started: "Игра началась! Удачи!",
      game_ended: "Игра окончена.",
      invalid_move: "Неверный ход. Попробуйте еще раз.",
      your_turn: "Ваш ход!",
      game_won: "{player} выиграл игру!",
      game_draw: "Игра закончилась вничью!",
      player_joined: "{player} присоединился к игре.",
      player_left: "{player} покинул игру.",
      waiting_for_player: "Ожидание другого игрока...",
      score_update: "Счет: {score}",
    },
    commands: {
      help: {
        description: "Показать доступные команды",
        usage: "/помощь",
      },
      start: {
        description: "Начать новую игру",
        usage: "/старт",
      },
      stop: {
        description: "Остановить текущую игру",
        usage: "/стоп",
      },
      move: {
        description: "Сделать ход",
        usage: "/ход <позиция>",
      },
      language: {
        description: "Изменить язык",
        usage: "/язык <код>",
      },
      status: {
        description: "Показать статус игры",
        usage: "/статус",
      },
      restart: {
        description: "Перезапустить игру",
        usage: "/перезапуск",
      },
      quit: {
        description: "Выйти из игры",
        usage: "/выход",
      },
    },
  },
  zh: {
    messages: {
      welcome: "欢迎来到游戏！",
      invalid_language: "无效的语言。请从以下选择：{languages}",
      language_updated: "语言已更新为 {language}",
      help: "可用命令：",
      unknown_command: "未知命令：{command}",
      game_started: "游戏开始！祝你好运！",
      game_ended: "游戏结束。",
      invalid_move: "无效移动。请重试。",
      your_turn: "轮到你了！",
      game_won: "{player} 赢得了游戏！",
      game_draw: "游戏平局！",
      player_joined: "{player} 加入了游戏。",
      player_left: "{player} 离开了游戏。",
      waiting_for_player: "等待其他玩家...",
      score_update: "分数：{score}",
    },
    commands: {
      help: {
        description: "显示可用命令",
        usage: "/帮助",
      },
      start: {
        description: "开始新游戏",
        usage: "/开始",
      },
      stop: {
        description: "停止当前游戏",
        usage: "/停止",
      },
      move: {
        description: "移动",
        usage: "/移动 <位置>",
      },
      language: {
        description: "更改语言",
        usage: "/语言 <代码>",
      },
      status: {
        description: "显示游戏状态",
        usage: "/状态",
      },
      restart: {
        description: "重新开始游戏",
        usage: "/重新开始",
      },
      quit: {
        description: "退出游戏",
        usage: "/退出",
      },
    },
  },
  ja: {
    messages: {
      welcome: "ゲームへようこそ！",
      invalid_language: "無効な言語です。以下から選択してください：{languages}",
      language_updated: "言語が {language} に更新されました",
      help: "利用可能なコマンド：",
      unknown_command: "不明なコマンド：{command}",
      game_started: "ゲーム開始！がんばってください！",
      game_ended: "ゲーム終了。",
      invalid_move: "無効な移動です。もう一度お試しください。",
      your_turn: "あなたの番です！",
      game_won: "{player} が勝利しました！",
      game_draw: "引き分けです！",
      player_joined: "{player} が参加しました。",
      player_left: "{player} が退出しました。",
      waiting_for_player: "他のプレイヤーを待っています...",
      score_update: "スコア：{score}",
    },
    commands: {
      help: {
        description: "利用可能なコマンドを表示",
        usage: "/ヘルプ",
      },
      start: {
        description: "新しいゲームを開始",
        usage: "/開始",
      },
      stop: {
        description: "現在のゲームを停止",
        usage: "/停止",
      },
      move: {
        description: "移動する",
        usage: "/移動 <位置>",
      },
      language: {
        description: "言語を変更",
        usage: "/言語 <コード>",
      },
      status: {
        description: "ゲームの状態を表示",
        usage: "/状態",
      },
      restart: {
        description: "ゲームを再開",
        usage: "/再開",
      },
      quit: {
        description: "ゲームを終了",
        usage: "/終了",
      },
    },
  },
  ko: {
    messages: {
      welcome: "게임에 오신 것을 환영합니다!",
      invalid_language:
        "잘못된 언어입니다. 다음 중에서 선택하세요: {languages}",
      language_updated: "언어가 {language}로 업데이트되었습니다",
      help: "사용 가능한 명령어:",
      unknown_command: "알 수 없는 명령어: {command}",
      game_started: "게임 시작! 행운을 빕니다!",
      game_ended: "게임 종료.",
      invalid_move: "잘못된 이동입니다. 다시 시도하세요.",
      your_turn: "당신의 차례입니다!",
      game_won: "{player}님이 게임에서 승리했습니다!",
      game_draw: "게임이 무승부로 끝났습니다!",
      player_joined: "{player}님이 게임에 참가했습니다.",
      player_left: "{player}님이 게임을 떠났습니다.",
      waiting_for_player: "다른 플레이어를 기다리는 중...",
      score_update: "점수: {score}",
    },
    commands: {
      help: {
        description: "사용 가능한 명령어 표시",
        usage: "/도움말",
      },
      start: {
        description: "새 게임 시작",
        usage: "/시작",
      },
      stop: {
        description: "현재 게임 중지",
        usage: "/중지",
      },
      move: {
        description: "이동하기",
        usage: "/이동 <위치>",
      },
      language: {
        description: "언어 변경",
        usage: "/언어 <코드>",
      },
      status: {
        description: "게임 상태 표시",
        usage: "/상태",
      },
      restart: {
        description: "게임 다시 시작",
        usage: "/다시시작",
      },
      quit: {
        description: "게임 종료",
        usage: "/종료",
      },
    },
  },
  he: {
    messages: {
      welcome: "!ברוכים הבאים למשחק",
      invalid_language: "{languages} :שפה לא חוקית. אנא בחר מתוך",
      language_updated: "{language}-השפה עודכנה ל",
      help: ":פקודות זמינות",
      unknown_command: "{command} :פקודה לא מוכרת",
      game_started: "!המשחק התחיל! בהצלחה",
      game_ended: ".המשחק הסתיים",
      invalid_move: ".מהלך לא חוקי. אנא נסה שוב",
      your_turn: "!תורך",
      game_won: "!ניצח במשחק {player}",
      game_draw: "!המשחק הסתיים בתיקו",
      player_joined: ".הצטרף למשחק {player}",
      player_left: ".עזב את המשחק {player}",
      waiting_for_player: "...ממתין לשחקן נוסף",
      score_update: "{score} :ניקוד",
    },
    commands: {
      help: {
        description: "הצג פקודות זמינות",
        usage: "עזרה/",
      },
      start: {
        description: "התחל משחק חדש",
        usage: "התחל/",
      },
      stop: {
        description: "עצור את המשחק הנוכחי",
        usage: "עצור/",
      },
      move: {
        description: "בצע מהלך",
        usage: "<מיקום> זוז/",
      },
      language: {
        description: "שנה שפה",
        usage: "<קוד> שפה/",
      },
      status: {
        description: "הצג מצב משחק",
        usage: "מצב/",
      },
      restart: {
        description: "התחל מחדש את המשחק",
        usage: "התחל-מחדש/",
      },
      quit: {
        description: "צא מהמשחק",
        usage: "צא/",
      },
    },
  },
};

/**
 * Get a translated message with parameter substitution
 * @param lang The target language
 * @param key The translation key
 * @param params Optional parameters to substitute in the message
 * @returns The translated message with parameters substituted
 */
export function getMessage(
  lang: SupportedLanguage,
  key: TranslationKey,
  params: Record<string, string> = {}
): string {
  const message = TRANSLATIONS[lang].messages[key];
  return substituteParams(message, params);
}

/**
 * Get command information in the specified language
 * @param lang The target language
 * @param command The command to get information for
 * @returns The translated command information
 */
export function getCommandInfo(
  lang: SupportedLanguage,
  command: CommandKey
): CommandInfo {
  return TRANSLATIONS[lang].commands[command];
}

/**
 * Get all available commands in the specified language
 * @param lang The target language
 * @returns Array of command information
 */
export function getAvailableCommands(
  lang: SupportedLanguage
): Array<{ command: CommandKey } & CommandInfo> {
  return Object.entries(TRANSLATIONS[lang].commands).map(([cmd, info]) => ({
    command: cmd as CommandKey,
    ...info,
  }));
}

/**
 * Helper function to substitute parameters in a message
 * @param message The message template
 * @param params The parameters to substitute
 * @returns The message with parameters substituted
 */
function substituteParams(
  message: string,
  params: Record<string, string>
): string {
  return message.replace(
    /\{(\w+)\}/g,
    (_match: string, param: string) => params[param] || `{${param}}`
  );
}

/**
 * Get the display name of a language in its native form
 * @param lang The language code
 * @returns The native name of the language
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return SUPPORTED_LANGUAGES[lang];
}

/**
 * Format a help message in the specified language
 * @param lang The target language
 * @returns Formatted help message with all available commands
 */
export function formatHelpMessage(lang: SupportedLanguage): string {
  const commands = getAvailableCommands(lang);
  const helpHeader = getMessage(lang, "help");

  return [
    helpHeader,
    ...commands.map((cmd) => `${cmd.usage} - ${cmd.description}`),
  ].join("\n");
}
