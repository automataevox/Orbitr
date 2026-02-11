import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";
import { prisma } from "@orbitr/database";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const docker = getDockerManager();
    await docker.stopContainer(params.id);

    // Update database
    await prisma.container.update({
      where: { dockerId: params.id },
      data: { status: "stopped" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
