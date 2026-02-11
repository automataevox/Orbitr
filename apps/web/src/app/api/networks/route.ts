import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/networks - List all Docker networks
 */
export async function GET() {
  try {
    const dockerManager = getDockerManager();
    const networks = await dockerManager.listNetworks();

    return NextResponse.json({ networks });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list networks", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/networks - Create a Docker network
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, driver = "bridge", subnet, gateway } = body;

    if (!name) {
      return NextResponse.json({ error: "Network name is required" }, { status: 400 });
    }

    const dockerManager = getDockerManager();
    const network = await dockerManager.createNetwork(name, {
      Driver: driver,
      IPAM: subnet ? {
        Config: [{ Subnet: subnet, Gateway: gateway }]
      } : undefined,
      Labels: {
        "com.orbitr.managed": "true",
      }
    });

    return NextResponse.json({ 
      message: "Network created successfully",
      network 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create network", details: error.message },
      { status: 500 }
    );
  }
}
