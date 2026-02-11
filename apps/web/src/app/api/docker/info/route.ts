import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export async function GET() {
  try {
    const docker = getDockerManager();
    const dockerode = (docker as any).docker;
    const info = await dockerode.info();
    return NextResponse.json({ info });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
