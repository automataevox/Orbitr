import { NextResponse } from "next/server";
import { getProxyManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/proxy/routes - List all proxy routes
 */
export async function GET() {
  try {
    const proxyManager = getProxyManager();
    const routes = await proxyManager.getRoutes();

    return NextResponse.json({ routes });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list proxy routes", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proxy/routes - Create a proxy route
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      containerId, 
      subdomain, 
      domain, 
      targetPort, 
      protocol = "http", 
      sslEnabled = false,
      customConfig 
    } = body;

    if (!containerId || !subdomain || !targetPort) {
      return NextResponse.json(
        { error: "containerId, subdomain, and targetPort are required" },
        { status: 400 }
      );
    }

    const proxyManager = getProxyManager();
    await proxyManager.createRoute({
      containerId,
      subdomain,
      domain,
      targetPort,
      protocol,
      sslEnabled,
      customConfig,
    });

    return NextResponse.json({ message: "Proxy route created successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create proxy route", details: error.message },
      { status: 500 }
    );
  }
}
