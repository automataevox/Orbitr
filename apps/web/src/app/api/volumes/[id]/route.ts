import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/volumes/[id] - Remove a Docker volume
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dockerManager = getDockerManager();
    await dockerManager.removeVolume(params.id);

    return NextResponse.json({ message: "Volume removed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to remove volume", details: error.message },
      { status: 500 }
    );
  }
}
