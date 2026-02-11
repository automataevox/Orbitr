import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/networks/[id] - Remove a Docker network
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dockerManager = getDockerManager();
    await dockerManager.removeNetwork(params.id);

    return NextResponse.json({ message: "Network removed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to remove network", details: error.message },
      { status: 500 }
    );
  }
}
