import { NextResponse } from "next/server";
import { prisma } from "@orbitr/database";

export async function GET() {
  try {
    const extensions = await prisma.extension.findMany({
      include: {
        containers: {
          select: {
            id: true,
            dockerId: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(extensions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
