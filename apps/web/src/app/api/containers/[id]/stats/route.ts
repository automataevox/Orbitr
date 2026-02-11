import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const docker = getDockerManager();
    const stats = await docker.getContainerStats(params.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
