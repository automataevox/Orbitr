"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";

interface ContainerLogsViewerProps {
  containerId: string;
  containerName: string;
}

export function ContainerLogsViewer({ containerId, containerName }: ContainerLogsViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastMessage, send } = useWebSocket("ws://localhost:3001");

  useEffect(() => {
    if (lastMessage?.type === "logs" && lastMessage.containerId === containerId) {
      setLogs((prev) => {
        const newLogs = lastMessage.data.split("\n").filter(Boolean);
        return [...prev, ...newLogs];
      });
    }
  }, [lastMessage, containerId]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSubscribe = () => {
    send({
      type: "subscribe_logs",
      containerId,
      tail: 100,
    });
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    send({
      type: "unsubscribe_logs",
      containerId,
    });
    setIsSubscribed(false);
    setLogs([]);
  };

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Container Logs</CardTitle>
            <CardDescription>{containerName}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {!isSubscribed ? (
              <Button onClick={handleSubscribe} disabled={!isConnected} size="sm">
                Start Streaming
              </Button>
            ) : (
              <>
                <Button onClick={handleClear} variant="outline" size="sm">
                  Clear
                </Button>
                <Button onClick={handleUnsubscribe} variant="destructive" size="sm">
                  Stop Streaming
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center mt-8">
              {isSubscribed ? "Waiting for logs..." : "Click 'Start Streaming' to view logs"}
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}
