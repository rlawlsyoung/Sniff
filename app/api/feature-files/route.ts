import { NextResponse } from "next/server";
import {
  clearFeatureFiles,
  listFeatureFiles,
} from "@/app/lib/server/feature-files-store";
import { publishFeatureFilesEvent } from "@/app/lib/server/feature-files-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const featureFiles = await listFeatureFiles();
  return NextResponse.json({ featureFiles });
}

export async function DELETE() {
  await clearFeatureFiles();

  publishFeatureFilesEvent({
    type: "clear",
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
