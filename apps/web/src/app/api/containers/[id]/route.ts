import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";
import { prisma } from "@orbitr/database";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const docker = getDockerManager();
    const info = await docker.inspectContainer(params.id);
    
    const dbContainer = await prisma.container.findUnique({
      where: { dockerId: params.id },
      include: { extension: true },
    });

    return NextResponse.json({ ...info, orbitr: dbContainer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const docker = getDockerManager();
    await docker.stopContainer(params.id);
    await docker.removeContainer(params.id, true);

    // Remove from database
    await prisma.container.delete({
      where: { dockerId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
