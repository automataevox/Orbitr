"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HealthPage() {
  // Fetch health statuses
  const { data, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to fetch health statuses");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch containers to enrich health data
  const { data: containersData } = useQuery({
    queryKey: ["containers"],
    queryFn: async () => {
      const res = await fetch("/api/containers");
      if (!res.ok) throw new Error("Failed to fetch containers");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const statuses = data?.statuses || [];
  const containers = containersData?.containers || [];

  // Create a map of container IDs to container info
  const containerMap = new Map(
    containers.map((c: any) => [c.Id, c])
  );

  const healthyCount = statuses.filter((s: any) => s.status === "healthy").length;
  const unhealthyCount = statuses.filter((s: any) => s.status === "unhealthy").length;
  const unknownCount = statuses.filter((s: any) => s.status === "unknown").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>;
      case "unknown":
        return <Badge variant="outline">Unknown</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Monitoring</h1>
        <p className="text-muted-foreground">Monitor the health of your containers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Healthy Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{healthyCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unhealthy Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{unhealthyCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unknown Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{unknownCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Container Health Status</CardTitle>
          <CardDescription>Real-time health check results for monitored containers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading health statuses...</p>
          ) : statuses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No health checks configured</p>
              <p className="text-sm text-muted-foreground">
                Health monitoring will start automatically when extensions with health checks are installed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Container</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status: any) => {
                  const container = containerMap.get(status.containerId);
                  const containerName = container?.Names?.[0]?.replace("/", "") || status.containerId.substring(0, 12);
                  
                  return (
                    <TableRow key={status.containerId}>
                      <TableCell className="font-medium">{containerName}</TableCell>
                      <TableCell>{getStatusBadge(status.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {status.message || "No issues detected"}
                      </TableCell>
                      <TableCell>{new Date(status.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        {status.responseTime ? `${status.responseTime}ms` : "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
