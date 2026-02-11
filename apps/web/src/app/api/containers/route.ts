import { NextResponse } from "next/server";
import { getDockerManager } from "@orbitr/core";
import { prisma } from "@orbitr/database";

export async function GET() {
  try {
    const docker = getDockerManager();
    const containers = await docker.listContainers(true);
    
    // Enrich with database info
    const enriched = await Promise.all(
      containers.map(async (container) => {
        const dbContainer = await prisma.container.findUnique({
          where: { dockerId: container.Id },
          include: { extension: true },
        });

        return {
          ...container,
          orbitr: dbContainer,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docker = getDockerManager();

    const container = await docker.createContainer(body);
    await docker.startContainer(container.id);

    // Save to database
    const info = await docker.inspectContainer(container.id);
    const dbContainer = await prisma.container.create({
      data: {
        dockerId: container.id,
        name: info.Name.replace("/", ""),
        image: info.Config.Image,
        status: "running",
        config: body,
      },
    });

    return NextResponse.json(dbContainer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
