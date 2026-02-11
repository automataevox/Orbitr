"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "health_check_failed":
        return "⚠️";
      case "extension_installed":
        return "📦";
      case "extension_failed":
        return "❌";
      case "backup_completed":
        return "💾";
      case "container_stopped":
        return "⏹️";
      case "container_started":
        return "▶️";
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "health_check_failed":
      case "extension_failed":
      case "container_stopped":
        return "destructive";
      case "extension_installed":
      case "backup_completed":
      case "container_started":
        return "default";
      default:
        return "secondary";
    }
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-muted-foreground mb-1">No notifications</p>
              <p className="text-sm text-muted-foreground">
                You'll see important updates here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={notification.read ? "opacity-60" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">
                          {notification.title}
                        </CardTitle>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {notification.message}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(notification.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
