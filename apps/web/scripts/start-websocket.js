#!/usr/bin/env node

/**
 * WebSocket Server Starter
 * 
 * This script starts the WebSocket server for real-time container logs and stats.
 * It should be run alongside the Next.js development server.
 * 
 * Usage: node scripts/start-websocket.js
 */

const { getWebSocketServer } = require("@orbitr/core");

const PORT = process.env.WS_PORT || 3001;

console.log("Starting Orbitr WebSocket Server...");

const wsServer = getWebSocketServer(PORT);
wsServer.start();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down WebSocket server...");
  wsServer.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down WebSocket server...");
  wsServer.stop();
  process.exit(0);
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
console.log("Press Ctrl+C to stop");
