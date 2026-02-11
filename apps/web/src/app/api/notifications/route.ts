import { NextResponse } from "next/server";
import { prisma } from "@orbitr/database";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications - List all notifications
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list notifications", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create a notification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, message, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title, and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        read: false,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      message: "Notification created",
      notification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - Mark all as read
 */
export async function PATCH() {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update notifications", details: error.message },
      { status: 500 }
    );
  }
}
