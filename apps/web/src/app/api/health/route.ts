import { NextResponse } from "next/server";
import { getHealthMonitor } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/health - Get health status for all monitored containers
 */
export async function GET() {
  try {
    const healthMonitor = getHealthMonitor();
    const statuses = await healthMonitor.getAllHealthStatus();

    return NextResponse.json({ statuses });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get health statuses", details: error.message },
      { status: 500 }
    );
  }
}
