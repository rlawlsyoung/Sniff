import { NextResponse } from "next/server";
import {
  clearFeatureFiles,
  listFeatureFiles,
} from "@/app/lib/server/feature-files-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const featureFiles = await listFeatureFiles();
  return NextResponse.json({ featureFiles });
}

export async function DELETE() {
  await clearFeatureFiles();
  return NextResponse.json({ ok: true });
}
