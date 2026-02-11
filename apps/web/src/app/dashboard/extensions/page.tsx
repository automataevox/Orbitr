"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  tags: string[];
  author: {
    name: string;
  };
  downloads: number;
  installed: boolean;
  status?: string;
}

export default function ExtensionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: extensions, refetch } = useQuery<Extension[]>({
    queryKey: ["extensions", "registry", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/extensions/registry?${params}`);
      if (!res.ok) throw new Error("Failed to fetch extensions");
      return res.json();
    },
  });

  const { data: installed } = useQuery<any[]>({
    queryKey: ["extensions", "installed"],
    queryFn: async () => {
      const res = await fetch("/api/extensions/installed");
      if (!res.ok) throw new Error("Failed to fetch installed extensions");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const handleInstall = async (extensionId: string) => {
    try {
      const res = await fetch("/api/extensions/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extensionId }),
      });

      if (!res.ok) throw new Error("Failed to start installation");

      toast.success("Extension installation started");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredExtensions = extensions?.filter((ext) => {
    if (activeTab === "installed") return ext.installed;
    if (activeTab === "apps") return ext.type === "app";
    if (activeTab === "tools") return ext.type === "tool";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Extensions</h1>
          <p className="text-muted-foreground">Browse and install extensions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search extensions..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installed?.length || 0})</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExtensions?.map((ext) => (
              <Card key={ext.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ext.name}</CardTitle>
                      <CardDescription className="mt-1">by {ext.author.name}</CardDescription>
                    </div>
                    <Badge variant="outline">{ext.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ext.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ext.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>v{ext.version}</span>
                    <span>{ext.downloads.toLocaleString()} downloads</span>
                  </div>

                  <div className="mt-4">
                    {ext.installed ? (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Installed
                      </Button>
                    ) : (
                      <Button onClick={() => handleInstall(ext.id)} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Install
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExtensions?.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No extensions found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
