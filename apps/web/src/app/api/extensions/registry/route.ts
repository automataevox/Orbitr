import { NextResponse } from "next/server";
import { getExtensionRegistry } from "@orbitr/core";
import { prisma } from "@orbitr/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");

    const registry = getExtensionRegistry();
    
    // Load registry if not already loaded
    try {
      await registry.load();
    } catch {
      // If local registry doesn't exist, try to refresh from remote
      await registry.refresh();
    }

    let extensions = registry.getAll();

    // Apply filters
    if (query) {
      extensions = registry.search(query);
    }
    if (type) {
      extensions = extensions.filter((ext) => ext.type === type);
    }
    if (tag) {
      extensions = extensions.filter((ext) => ext.tags.includes(tag));
    }

    // Check which extensions are installed
    const installed = await prisma.extension.findMany({
      select: { id: true, status: true },
    });

    const installedMap = new Map(installed.map((ext) => [ext.id, ext.status]));

    const enriched = extensions.map((ext) => ({
      ...ext,
      installed: installedMap.has(ext.id),
      status: installedMap.get(ext.id),
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
