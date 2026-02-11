import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/images/[id] - Remove a Docker image
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dockerManager = getDockerManager();
    await dockerManager.removeImage(params.id);

    return NextResponse.json({ message: "Image removed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to remove image", details: error.message },
      { status: 500 }
    );
  }
}
