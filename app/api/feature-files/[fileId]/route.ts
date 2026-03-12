import { NextResponse } from "next/server";
import { QaFeatureFile } from "@/app/lib/gherkin";
import {
  deleteFeatureFile,
  upsertFeatureFile,
} from "@/app/lib/server/feature-files-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

type UpsertFeatureFileBody = {
  featureFile?: QaFeatureFile;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { fileId } = await params;

  let body: UpsertFeatureFileBody;
  try {
    body = (await request.json()) as UpsertFeatureFileBody;
  } catch {
    return NextResponse.json({ message: "invalid-json" }, { status: 400 });
  }

  if (!body.featureFile || typeof body.featureFile !== "object") {
    return NextResponse.json(
      { message: "featureFile is required" },
      { status: 400 },
    );
  }

  const saved = await upsertFeatureFile({
    ...body.featureFile,
    id: fileId,
  });

  return NextResponse.json({ featureFile: saved });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { fileId } = await params;

  const removed = await deleteFeatureFile(fileId);
  if (!removed) {
    return NextResponse.json({ message: "not-found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
