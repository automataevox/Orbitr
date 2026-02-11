import { NextResponse } from "next/server";
import { getProxyManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/proxy/routes/[id] - Remove a proxy route
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proxyManager = getProxyManager();
    await proxyManager.removeRoute(params.id);

    return NextResponse.json({ message: "Proxy route removed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to remove proxy route", details: error.message },
      { status: 500 }
    );
  }
}
