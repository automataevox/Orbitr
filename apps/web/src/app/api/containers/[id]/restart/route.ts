import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const docker = getDockerManager();
    await docker.restartContainer(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
