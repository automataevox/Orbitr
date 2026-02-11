"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Square, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  orbitr?: {
    id: string;
    dockerId: string;
    name: string;
    status: string;
    extension: {
      id: string;
      name: string;
    } | null;
  };
}

export default function ContainersPage() {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { data: containers, refetch } = useQuery<Container[]>({
    queryKey: ["containers"],
    queryFn: async () => {
      const res = await fetch("/api/containers");
      if (!res.ok) throw new Error("Failed to fetch containers");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const handleAction = async (id: string, action: "start" | "stop" | "restart" | "remove") => {
    setActionInProgress(id);
    try {
      const endpoint = `/api/containers/${id}/${action === "remove" ? "" : action}`;
      const res = await fetch(endpoint, {
        method: action === "remove" ? "DELETE" : "POST",
      });

      if (!res.ok) throw new Error(`Failed to ${action} container`);

      toast.success(`Container ${action}ed successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (state: string) => {
    if (state === "running") return <Badge variant="success">Running</Badge>;
    if (state === "paused") return <Badge variant="secondary">Paused</Badge>;
    if (state === "exited") return <Badge variant="destructive">Exited</Badge>;
    return <Badge variant="outline">{state}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Containers</h1>
          <p className="text-muted-foreground">Manage Docker containers</p>
        </div>
        <Button>Create Container</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Containers ({containers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Extension</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers?.map((container) => (
                <TableRow key={container.Id}>
                  <TableCell className="font-medium">
                    {container.Names[0]?.replace("/", "")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {container.Image}
                  </TableCell>
                  <TableCell>{getStatusBadge(container.State)}</TableCell>
                  <TableCell className="text-sm">
                    {container.orbitr?.extension ? (
                      <Badge variant="outline">{container.orbitr.extension.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {container.State === "running" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAction(container.Id, "restart")}
                            disabled={actionInProgress === container.Id}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAction(container.Id, "stop")}
                            disabled={actionInProgress === container.Id}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAction(container.Id, "start")}
                          disabled={actionInProgress === container.Id}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAction(container.Id, "remove")}
                        disabled={actionInProgress === container.Id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {containers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No containers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
