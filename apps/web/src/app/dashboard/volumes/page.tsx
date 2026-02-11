"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function VolumesPage() {
  const [volumeName, setVolumeName] = useState("");
  const queryClient = useQueryClient();

  // Fetch volumes
  const { data, isLoading } = useQuery({
    queryKey: ["volumes"],
    queryFn: async () => {
      const res = await fetch("/api/volumes");
      if (!res.ok) throw new Error("Failed to fetch volumes");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Create volume mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/volumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to create volume");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Volume created successfully");
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      setVolumeName("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove volume mutation
  const removeMutation = useMutation({
    mutationFn: async (volumeName: string) => {
      const res = await fetch(`/api/volumes/${volumeName}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to remove volume");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Volume removed successfully");
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!volumeName) {
      toast.error("Please enter a volume name");
      return;
    }
    createMutation.mutate({ name: volumeName });
  };

  const volumes = data?.volumes || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volumes</h1>
        <p className="text-muted-foreground">Manage persistent data storage for containers</p>
      </div>

      {/* Create Volume Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Volume</CardTitle>
          <CardDescription>Create a new Docker volume for data persistence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Volume name"
              value={volumeName}
              onChange={(e) => setVolumeName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Volumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Volumes ({volumes.length})</CardTitle>
          <CardDescription>All Docker volumes on this system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading volumes...</p>
          ) : volumes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No volumes found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Mountpoint</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumes.map((volume: any) => (
                  <TableRow key={volume.Name}>
                    <TableCell className="font-medium">{volume.Name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{volume.Driver}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate">
                      {volume.Mountpoint}
                    </TableCell>
                    <TableCell>{volume.Scope}</TableCell>
                    <TableCell>
                      {volume.CreatedAt ? new Date(volume.CreatedAt).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMutation.mutate(volume.Name)}
                        disabled={removeMutation.isPending}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
