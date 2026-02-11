import { NextResponse } from "next/server";
import { getExtensionLoader } from "@orbitr/core";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const loader = getExtensionLoader();
    await loader.stop(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
