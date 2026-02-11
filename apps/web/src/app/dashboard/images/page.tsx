"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ImagesPage() {
  const [pullImage, setPullImage] = useState("");
  const [pullTag, setPullTag] = useState("latest");
  const queryClient = useQueryClient();

  // Fetch images
  const { data, isLoading } = useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await fetch("/api/images");
      if (!res.ok) throw new Error("Failed to fetch images");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Pull image mutation
  const pullMutation = useMutation({
    mutationFn: async (data: { image: string; tag: string }) => {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to pull image");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Image pulled successfully");
      queryClient.invalidateQueries({ queryKey: ["images"] });
      setPullImage("");
      setPullTag("latest");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove image mutation
  const removeMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to remove image");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Image removed successfully");
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePull = () => {
    if (!pullImage) {
      toast.error("Please enter an image name");
      return;
    }
    pullMutation.mutate({ image: pullImage, tag: pullTag });
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const images = data?.images || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Images</h1>
        <p className="text-muted-foreground">Manage Docker images on your system</p>
      </div>

      {/* Pull Image Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pull Image</CardTitle>
          <CardDescription>Download a Docker image from a registry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Image name (e.g., nginx, postgres)"
              value={pullImage}
              onChange={(e) => setPullImage(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Tag"
              value={pullTag}
              onChange={(e) => setPullTag(e.target.value)}
              className="w-32"
            />
            <Button 
              onClick={handlePull} 
              disabled={pullMutation.isPending}
            >
              {pullMutation.isPending ? "Pulling..." : "Pull Image"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images List */}
      <Card>
        <CardHeader>
          <CardTitle>Images ({images.length})</CardTitle>
          <CardDescription>All Docker images available on this system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading images...</p>
          ) : images.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No images found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Image ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images.map((image: any) => {
                  const repoTags = image.RepoTags || ["<none>:<none>"];
                  return repoTags.map((repoTag: string, idx: number) => {
                    const [repo, tag] = repoTag.split(":");
                    return (
                      <TableRow key={`${image.Id}-${idx}`}>
                        <TableCell className="font-medium">{repo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tag}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {image.Id.replace("sha256:", "").substring(0, 12)}
                        </TableCell>
                        <TableCell>{formatDate(image.Created)}</TableCell>
                        <TableCell>{formatSize(image.Size)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMutation.mutate(image.Id)}
                            disabled={removeMutation.isPending}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
