"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NetworksPage() {
  const [networkName, setNetworkName] = useState("");
  const [driver, setDriver] = useState("bridge");
  const queryClient = useQueryClient();

  // Fetch networks
  const { data, isLoading } = useQuery({
    queryKey: ["networks"],
    queryFn: async () => {
      const res = await fetch("/api/networks");
      if (!res.ok) throw new Error("Failed to fetch networks");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Create network mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; driver: string }) => {
      const res = await fetch("/api/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to create network");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Network created successfully");
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      setNetworkName("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove network mutation
  const removeMutation = useMutation({
    mutationFn: async (networkId: string) => {
      const res = await fetch(`/api/networks/${networkId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to remove network");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Network removed successfully");
      queryClient.invalidateQueries({ queryKey: ["networks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!networkName) {
      toast.error("Please enter a network name");
      return;
    }
    createMutation.mutate({ name: networkName, driver });
  };

  const networks = data?.networks || [];
  const customNetworks = networks.filter((n: any) => 
    !["bridge", "host", "none"].includes(n.Name)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Networks</h1>
        <p className="text-muted-foreground">Manage Docker networks for container communication</p>
      </div>

      {/* Create Network Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Network</CardTitle>
          <CardDescription>Create a custom Docker network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Network name"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              className="flex-1"
            />
            <select
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="bridge">Bridge</option>
              <option value="overlay">Overlay</option>
              <option value="macvlan">Macvlan</option>
            </select>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Networks List */}
      <Card>
        <CardHeader>
          <CardTitle>Networks ({networks.length})</CardTitle>
          <CardDescription>All Docker networks on this system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading networks...</p>
          ) : networks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No networks found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Network ID</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Subnet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((network: any) => {
                  const ipamConfig = network.IPAM?.Config?.[0];
                  const subnet = ipamConfig?.Subnet || "N/A";
                  const isSystem = ["bridge", "host", "none"].includes(network.Name);
                  
                  return (
                    <TableRow key={network.Id}>
                      <TableCell className="font-medium">{network.Name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {network.Id.substring(0, 12)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{network.Driver}</Badge>
                      </TableCell>
                      <TableCell>{network.Scope}</TableCell>
                      <TableCell className="font-mono text-sm">{subnet}</TableCell>
                      <TableCell className="text-right">
                        {!isSystem && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMutation.mutate(network.Id)}
                            disabled={removeMutation.isPending}
                          >
                            Remove
                          </Button>
                        )}
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
