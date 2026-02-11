"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Puzzle, Activity, Server } from "lucide-react";

interface DockerInfo {
  info: {
    ServerVersion: string;
    Containers: number;
    ContainersRunning: number;
    ContainersStopped: number;
    Images: number;
    NCPU: number;
    MemTotal: number;
  };
}

export default function DashboardPage() {
  const { data: dockerInfo } = useQuery<DockerInfo>({
    queryKey: ["docker", "info"],
    queryFn: async () => {
      const res = await fetch("/api/docker/info");
      if (!res.ok) throw new Error("Failed to fetch Docker info");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const stats = [
    {
      name: "Containers Running",
      value: dockerInfo?.info?.ContainersRunning || 0,
      total: dockerInfo?.info?.Containers || 0,
      icon: Box,
      color: "text-blue-500",
    },
    {
      name: "Extensions Installed",
      value: 0, // TODO: Fetch from API
      icon: Puzzle,
      color: "text-purple-500",
    },
    {
      name: "Images",
      value: dockerInfo?.info?.Images || 0,
      icon: Server,
      color: "text-green-500",
    },
    {
      name: "System Health",
      value: "Healthy",
      icon: Activity,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Docker-native self-hosting orchestration platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.total && <span className="text-sm text-muted-foreground">/{stat.total}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Docker engine details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Docker Version</div>
              <div className="text-lg font-semibold">{dockerInfo?.info?.ServerVersion || "Loading..."}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">CPU Cores</div>
              <div className="text-lg font-semibold">{dockerInfo?.info?.NCPU || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Memory</div>
              <div className="text-lg font-semibold">
                {dockerInfo?.info ? `${(dockerInfo.info.MemTotal / 1024 / 1024 / 1024).toFixed(2)} GB` : "Loading..."}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="text-lg font-semibold text-green-500">Online</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/extensions"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <Puzzle className="h-8 w-8 text-purple-500" />
              <span className="font-medium">Browse Extensions</span>
            </a>
            <a
              href="/dashboard/containers"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <Box className="h-8 w-8 text-blue-500" />
              <span className="font-medium">Manage Containers</span>
            </a>
            <a
              href="/dashboard/settings"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <Server className="h-8 w-8 text-green-500" />
              <span className="font-medium">System Settings</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
