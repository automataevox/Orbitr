import { NextResponse } from "next/server";
import { getExtensionLoader } from "@orbitr/core";
import { prisma } from "@orbitr/database";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const extension = await prisma.extension.findUnique({
      where: { id: params.id },
      include: {
        containers: true,
      },
    });

    if (!extension) {
      return NextResponse.json({ error: "Extension not found" }, { status: 404 });
    }

    return NextResponse.json(extension);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const removeData = searchParams.get("removeData") === "true";

    const loader = getExtensionLoader();
    await loader.uninstall(params.id, removeData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
