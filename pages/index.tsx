import React, { useState } from "react";
import { Redis } from "@upstash/redis";
import { PlayerState, COMMANDS } from "../lib/game";
import Fuse from "fuse.js";

export async function getServerSideProps() {
  try {
    const redis = Redis.fromEnv();
    const keys = await redis.keys("player:*");
    const values = await redis.mget(keys);
    return { props: { keys, values } };
  } catch (error) {
    console.error(error);
    return { props: { keys: [], values: [] } };
  }
}

export default function Home({
  keys,
  values,
}: {
  keys: string[];
  values: string[];
}) {
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [gameState, setGameState] = useState<PlayerState | null>(null);

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
      setMessages((prev) => [...prev, `> ${command}`, data.message]);
      setCommand("");

      // Refresh game state
      try {
        const stateResponse = await fetch("/api/status");
        if (!stateResponse.ok) {
          console.error("Status response not OK:", await stateResponse.text());
          return;
        }
        const newState = await stateResponse.json();
        setGameState(newState);
      } catch (error) {
        console.error("Error fetching game state:", error);
      }
    } catch (error) {
      setMessages((prev) => [...prev, "Error processing command"]);
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Alliance Wars</h1>
            <button
              onClick={handleRestart}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Restart Game
            </button>
          </div>

          {gameState && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h2 className="font-bold mb-2">Player Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>Name: {gameState.name}</div>
                <div>Level: {gameState.level}</div>
                <div>Resources: {gameState.resources}</div>
                <div>Alliances: {gameState.alliances.length}</div>
              </div>
            </div>
          )}

          <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  msg.startsWith(">") ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {msg}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCommand()}
              placeholder="Enter command (e.g., 'help', 'register name')"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleCommand}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              Available commands: register, join, attack, collect, alliance,
              status, players
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
