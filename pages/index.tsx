import React, { useState } from "react";
import { Redis } from "@upstash/redis";
import { PlayerState, COMMANDS, GameData } from "../lib/game";
import Fuse from "fuse.js";

type Command = {
  name: string;
  description: string;
};

type HelpResponse = {
  success: boolean;
  isHelp: boolean;
  commands: {
    regular: Command[];
    admin: Command[];
  };
};

export async function getServerSideProps() {
  try {
    const redis = Redis.fromEnv();
    const gameKeys = await redis.keys("game:*");
    const games = await Promise.all(
      gameKeys.map(async (key) => await redis.get<GameData>(key))
    );

    // Extract all players from all games, safely handling null/undefined
    const players = games
      .filter(
        (game): game is GameData =>
          game !== null &&
          game !== undefined &&
          typeof game.players === "object"
      )
      .flatMap((game) => Object.values(game.players));

    return {
      props: {
        games: games.filter(
          (g): g is GameData => g !== null && g !== undefined
        ),
        players,
      },
    };
  } catch (error) {
    console.error(error);
    return { props: { games: [], players: [] } };
  }
}

export default function Home({
  games,
  players,
}: {
  games: GameData[];
  players: PlayerState[];
}) {
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [gameState, setGameState] = useState<PlayerState | null>(null);
  const [helpCommands, setHelpCommands] = useState<
    HelpResponse["commands"] | null
  >(null);

  // Initialize Fuse for command matching
  const commandFuse = new Fuse(Object.values(COMMANDS), {
    threshold: 0.3,
    distance: 3,
  });

  const handleCommand = async () => {
    if (!command.trim()) return;

    // Fuzzy match the command
    const parts = command.trim().toLowerCase().split(" ");
    const cmdMatch = commandFuse.search(parts[0]);
    const matchedCommand = cmdMatch.length > 0 ? cmdMatch[0].item : parts[0];
    const args = parts.slice(1);

    try {
      const response = await fetch("/api/twilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Body: `${matchedCommand} ${args.join(" ")}`.trim(),
          From: "web-client",
        }),
      });

      const data = await response.json();

      if (data.isHelp) {
        setHelpCommands(data.commands);
      } else {
        setMessages((prev) => [...prev, data.message || data.error]);
      }

      // Clear command after sending
      setCommand("");
    } catch (error) {
      console.error("Error sending command:", error);
      setMessages((prev) => [...prev, "Error sending command"]);
    }
  };

  const handleRestart = async () => {
    try {
      await fetch("/api/restart", { method: "POST" });
      setMessages([]);
      setGameState(null);
      setMessages(["Game restarted! Type 'register <name>' to begin."]);
    } catch (error) {
      setMessages((prev) => [...prev, "Error restarting game"]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                {helpCommands ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-2">
                        Available Commands:
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {helpCommands.regular.map((cmd, i) => (
                          <li key={i}>
                            <code className="bg-gray-100 px-1 rounded">
                              {cmd.name}
                            </code>
                            <span className="ml-2">{cmd.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">
                        Admin Commands:
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {helpCommands.admin.map((cmd, i) => (
                          <li key={i}>
                            <code className="bg-gray-100 px-1 rounded">
                              {cmd.name}
                            </code>
                            <span className="ml-2">{cmd.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => setHelpCommands(null)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Back to Messages
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto max-h-96 space-y-2">
                      {messages.map((msg, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded">
                          {msg}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleCommand()}
                        placeholder="Enter command..."
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
