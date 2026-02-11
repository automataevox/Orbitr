import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/volumes - List all Docker volumes
 */
export async function GET() {
  try {
    const dockerManager = getDockerManager();
    const volumes = await dockerManager.listVolumes();

    return NextResponse.json({ volumes });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list volumes", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/volumes - Create a Docker volume
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, driver = "local" } = body;

    if (!name) {
      return NextResponse.json({ error: "Volume name is required" }, { status: 400 });
    }

    const dockerManager = getDockerManager();
    const volume = await dockerManager.createVolume(name, {
      Driver: driver,
      Labels: {
        "com.orbitr.managed": "true",
      }
    });

    return NextResponse.json({ 
      message: "Volume created successfully",
      volume 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create volume", details: error.message },
      { status: 500 }
    );
  }
}
