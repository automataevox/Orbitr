import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/simple - Simple health check for Docker healthcheck
 * Returns 200 OK if the server is running
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: "ok",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
