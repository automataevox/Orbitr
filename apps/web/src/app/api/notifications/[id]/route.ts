import { NextResponse } from "next/server";
import { prisma } from "@orbitr/database";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/notifications/[id] - Mark notification as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update notification", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id] - Delete a notification
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Notification deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete notification", details: error.message },
      { status: 500 }
    );
  }
}
