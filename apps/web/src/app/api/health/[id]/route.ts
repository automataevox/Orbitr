import { NextResponse } from "next/server";
import { getHealthMonitor } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/[id] - Get health status for specific container
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const healthMonitor = getHealthMonitor();
    const status = await healthMonitor.getHealthStatus(params.id);

    if (!status) {
      return NextResponse.json({ error: "Health check not found" }, { status: 404 });
    }

    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get health status", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/[id] - Start monitoring a container
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, endpoint, port, interval = 30, timeout = 10, retries = 3, command } = body;

    if (!type) {
      return NextResponse.json({ error: "Health check type is required" }, { status: 400 });
    }

    const healthMonitor = getHealthMonitor();
    await healthMonitor.startMonitoring(params.id, {
      type,
      endpoint,
      port,
      interval,
      timeout,
      retries,
      command,
    });

    return NextResponse.json({ message: "Health monitoring started" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to start health monitoring", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/[id] - Stop monitoring a container
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const healthMonitor = getHealthMonitor();
    healthMonitor.stopMonitoring(params.id);

    return NextResponse.json({ message: "Health monitoring stopped" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to stop health monitoring", details: error.message },
      { status: 500 }
    );
  }
}
