import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [latestSnapshot, historySnapshot] = await Promise.all([
      adminDb.ref("streetlight/latest").once("value"),
      adminDb.ref("streetlight/history").limitToLast(120).once("value"),
    ]);
    const data = {
      latest: latestSnapshot.val(),
      history: historySnapshot.val(),
    };

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}