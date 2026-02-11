import { WebSocketServer, WebSocket } from "ws";
import { getDockerManager } from "@orbitr/core";
import { logger } from "@orbitr/core";

export interface WebSocketMessage {
  type: "subscribe_logs" | "unsubscribe_logs" | "subscribe_stats" | "unsubscribe_stats";
  containerId?: string;
  tail?: number;
}

export class OrbitrWebSocketServer {
  private wss: WebSocketServer | null = null;
  private logSubscriptions: Map<string, Set<WebSocket>> = new Map();
  private statsSubscriptions: Map<string, Set<WebSocket>> = new Map();
  private logStreams: Map<string, any> = new Map();
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private port: number = 3001) {}

  start() {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on("connection", (ws: WebSocket) => {
      logger.info("WebSocket client connected");

      ws.on("message", async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error: any) {
          logger.error({ error }, "Failed to handle WebSocket message");
          ws.send(JSON.stringify({ type: "error", message: error.message }));
        }
      });

      ws.on("close", () => {
        logger.info("WebSocket client disconnected");
        this.cleanupSubscriptions(ws);
      });

      ws.on("error", (error) => {
        logger.error({ error }, "WebSocket error");
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: "connected", message: "Connected to Orbitr WebSocket" }));
    });

    logger.info({ port: this.port }, "WebSocket server started");
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage) {
    const dockerManager = getDockerManager();

    switch (message.type) {
      case "subscribe_logs":
        if (!message.containerId) {
          throw new Error("containerId is required for log subscription");
        }
        await this.subscribeToLogs(ws, message.containerId, message.tail);
        break;

      case "unsubscribe_logs":
        if (!message.containerId) {
          throw new Error("containerId is required for log unsubscription");
        }
        this.unsubscribeFromLogs(ws, message.containerId);
        break;

      case "subscribe_stats":
        if (!message.containerId) {
          throw new Error("containerId is required for stats subscription");
        }
        await this.subscribeToStats(ws, message.containerId);
        break;

      case "unsubscribe_stats":
        if (!message.containerId) {
          throw new Error("containerId is required for stats unsubscription");
        }
        this.unsubscribeFromStats(ws, message.containerId);
        break;

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }

  private async subscribeToLogs(ws: WebSocket, containerId: string, tail: number = 100) {
    // Add to subscription set
    if (!this.logSubscriptions.has(containerId)) {
      this.logSubscriptions.set(containerId, new Set());
    }
    this.logSubscriptions.get(containerId)!.add(ws);

    // If stream doesn't exist, create it
    if (!this.logStreams.has(containerId)) {
      const dockerManager = getDockerManager();
      
      try {
        // Get initial logs
        const initialLogs = await dockerManager.getContainerLogs(containerId, {
          tail,
          stdout: true,
          stderr: true,
          timestamps: true,
        });

        // Send initial logs
        ws.send(JSON.stringify({
          type: "logs",
          containerId,
          data: initialLogs,
          initial: true,
        }));

        // Start streaming new logs
        const container = dockerManager["docker"].getContainer(containerId);
        const stream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          timestamps: true,
          tail: 0, // Only new logs
        });

        stream.on("data", (chunk: Buffer) => {
          const subscribers = this.logSubscriptions.get(containerId);
          if (subscribers) {
            const logData = chunk.toString("utf-8");
            subscribers.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "logs",
                  containerId,
                  data: logData,
                  initial: false,
                }));
              }
            });
          }
        });

        stream.on("error", (error) => {
          logger.error({ error, containerId }, "Log stream error");
          this.broadcastToSubscribers(containerId, "logs", {
            type: "error",
            containerId,
            message: error.message,
          });
        });

        this.logStreams.set(containerId, stream);
      } catch (error: any) {
        logger.error({ error, containerId }, "Failed to subscribe to logs");
        ws.send(JSON.stringify({
          type: "error",
          message: `Failed to subscribe to logs: ${error.message}`,
        }));
      }
    }

    ws.send(JSON.stringify({
      type: "subscribed",
      resource: "logs",
      containerId,
    }));
  }

  private unsubscribeFromLogs(ws: WebSocket, containerId: string) {
    const subscribers = this.logSubscriptions.get(containerId);
    if (subscribers) {
      subscribers.delete(ws);

      // If no more subscribers, close the stream
      if (subscribers.size === 0) {
        const stream = this.logStreams.get(containerId);
        if (stream) {
          stream.destroy();
          this.logStreams.delete(containerId);
        }
        this.logSubscriptions.delete(containerId);
      }
    }

    ws.send(JSON.stringify({
      type: "unsubscribed",
      resource: "logs",
      containerId,
    }));
  }

  private async subscribeToStats(ws: WebSocket, containerId: string) {
    // Add to subscription set
    if (!this.statsSubscriptions.has(containerId)) {
      this.statsSubscriptions.set(containerId, new Set());
    }
    this.statsSubscriptions.get(containerId)!.add(ws);

    // If interval doesn't exist, create it
    if (!this.statsIntervals.has(containerId)) {
      const dockerManager = getDockerManager();

      const interval = setInterval(async () => {
        try {
          const stats = await dockerManager.getContainerStats(containerId);
          
          const subscribers = this.statsSubscriptions.get(containerId);
          if (subscribers) {
            subscribers.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stats",
                  containerId,
                  data: stats,
                }));
              }
            });
          }
        } catch (error: any) {
          logger.error({ error, containerId }, "Failed to get container stats");
        }
      }, 1000); // Update every second

      this.statsIntervals.set(containerId, interval);
    }

    ws.send(JSON.stringify({
      type: "subscribed",
      resource: "stats",
      containerId,
    }));
  }

  private unsubscribeFromStats(ws: WebSocket, containerId: string) {
    const subscribers = this.statsSubscriptions.get(containerId);
    if (subscribers) {
      subscribers.delete(ws);

      // If no more subscribers, clear the interval
      if (subscribers.size === 0) {
        const interval = this.statsIntervals.get(containerId);
        if (interval) {
          clearInterval(interval);
          this.statsIntervals.delete(containerId);
        }
        this.statsSubscriptions.delete(containerId);
      }
    }

    ws.send(JSON.stringify({
      type: "unsubscribed",
      resource: "stats",
      containerId,
    }));
  }

  private cleanupSubscriptions(ws: WebSocket) {
    // Clean up log subscriptions
    for (const [containerId, subscribers] of this.logSubscriptions.entries()) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        const stream = this.logStreams.get(containerId);
        if (stream) {
          stream.destroy();
          this.logStreams.delete(containerId);
        }
        this.logSubscriptions.delete(containerId);
      }
    }

    // Clean up stats subscriptions
    for (const [containerId, subscribers] of this.statsSubscriptions.entries()) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        const interval = this.statsIntervals.get(containerId);
        if (interval) {
          clearInterval(interval);
          this.statsIntervals.delete(containerId);
        }
        this.statsSubscriptions.delete(containerId);
      }
    }
  }

  private broadcastToSubscribers(containerId: string, type: string, message: any) {
    const subscribers = this.logSubscriptions.get(containerId);
    if (subscribers) {
      subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  stop() {
    // Clean up all streams and intervals
    for (const stream of this.logStreams.values()) {
      stream.destroy();
    }
    for (const interval of this.statsIntervals.values()) {
      clearInterval(interval);
    }

    this.logStreams.clear();
    this.statsIntervals.clear();
    this.logSubscriptions.clear();
    this.statsSubscriptions.clear();

    if (this.wss) {
      this.wss.close();
      logger.info("WebSocket server stopped");
    }
  }
}

// Singleton instance
let wsServer: OrbitrWebSocketServer | null = null;

export function getWebSocketServer(port?: number): OrbitrWebSocketServer {
  if (!wsServer) {
    wsServer = new OrbitrWebSocketServer(port);
  }
  return wsServer;
}

export default OrbitrWebSocketServer;
