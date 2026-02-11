"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const [dockerSocket, setDockerSocket] = useState("/var/run/docker.sock");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [enableTelemetry, setEnableTelemetry] = useState(false);
  const [proxyProvider, setProxyProvider] = useState<"traefik" | "caddy">("traefik");
  const [defaultDomain, setDefaultDomain] = useState("orbitr.local");

  // Fetch Docker info to verify connection
  const { data: dockerInfo } = useQuery({
    queryKey: ["docker-info"],
    queryFn: async () => {
      const res = await fetch("/api/docker/info");
      if (!res.ok) throw new Error("Failed to fetch Docker info");
      return res.json();
    },
  });

  const handleSaveSettings = () => {
    // In a real app, this would save to database/config file
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure Orbitr system preferences</p>
      </div>

      {/* Docker Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Docker Configuration</CardTitle>
          <CardDescription>Configure Docker engine connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Docker Socket Path</label>
            <Input
              value={dockerSocket}
              onChange={(e) => setDockerSocket(e.target.value)}
              placeholder="/var/run/docker.sock"
            />
            <p className="text-xs text-muted-foreground">
              Path to the Docker daemon socket on your system
            </p>
          </div>

          {dockerInfo && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Docker Engine Status</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Version:</span> {dockerInfo.info.ServerVersion}</p>
                <p><span className="text-muted-foreground">OS/Arch:</span> {dockerInfo.info.OperatingSystem} / {dockerInfo.info.Architecture}</p>
                <p><span className="text-muted-foreground">CPUs:</span> {dockerInfo.info.NCPU}</p>
                <p><span className="text-muted-foreground">Memory:</span> {(dockerInfo.info.MemTotal / 1024 / 1024 / 1024).toFixed(2)} GB</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reverse Proxy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reverse Proxy</CardTitle>
          <CardDescription>Configure reverse proxy settings for external access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proxy Provider</label>
            <select
              value={proxyProvider}
              onChange={(e) => setProxyProvider(e.target.value as "traefik" | "caddy")}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="traefik">Traefik</option>
              <option value="caddy">Caddy</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred reverse proxy server
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Default Domain</label>
            <Input
              value={defaultDomain}
              onChange={(e) => setDefaultDomain(e.target.value)}
              placeholder="orbitr.local"
            />
            <p className="text-xs text-muted-foreground">
              Default domain for extension subdomains (e.g., app.orbitr.local)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>General system preferences and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Auto Update Extensions</label>
              <p className="text-xs text-muted-foreground">
                Automatically update extensions when new versions are available
              </p>
            </div>
            <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable Telemetry</label>
              <p className="text-xs text-muted-foreground">
                Help improve Orbitr by sending anonymous usage data
              </p>
            </div>
            <Switch checked={enableTelemetry} onCheckedChange={setEnableTelemetry} />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Data Directory</label>
            <Input
              value="/var/lib/orbitr"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Location where Orbitr stores its data
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About Orbitr</CardTitle>
          <CardDescription>Version and system information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">1.0.0-alpha</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Build</span>
            <span className="text-sm font-medium font-mono">2024.02.11</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">License</span>
            <span className="text-sm font-medium">MIT</span>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
