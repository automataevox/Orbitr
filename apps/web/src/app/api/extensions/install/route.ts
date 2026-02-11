import { NextResponse } from "next/server";
import { getExtensionLoader } from "@orbitr/core";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { extensionId, environment, autoStart = true } = body;

    if (!extensionId) {
      return NextResponse.json({ error: "extensionId is required" }, { status: 400 });
    }

    const loader = getExtensionLoader();

    // Start installation in background
    // In production, use a job queue for long-running tasks
    loader
      .install(extensionId, { environment, autoStart })
      .then(() => {
        console.log(`Extension ${extensionId} installed successfully`);
      })
      .catch((error) => {
        console.error(`Failed to install extension ${extensionId}:`, error);
      });

    return NextResponse.json({
      message: "Installation started",
      extensionId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
