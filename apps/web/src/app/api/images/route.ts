import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/images - List all Docker images
 */
export async function GET() {
  try {
    const dockerManager = getDockerManager();
    const images = await dockerManager.listImages();

    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list images", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images - Pull a Docker image
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, tag = "latest" } = body;

    if (!image) {
      return NextResponse.json({ error: "Image name is required" }, { status: 400 });
    }

    const dockerManager = getDockerManager();
    const imageRef = tag ? `${image}:${tag}` : image;

    // Pull image with progress tracking
    await dockerManager.pullImage(imageRef, (progress: any) => {
      console.log("Pull progress:", progress);
    });

    return NextResponse.json({ 
      message: "Image pulled successfully",
      image: imageRef 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to pull image", details: error.message },
      { status: 500 }
    );
  }
}
