import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request) {
  console.log("[PROXY] incoming request to /api/getSuggestedSeedAndJobName");
  try {
    const res = await fetch(`${BACKEND_URL}/api/getSuggestedSeedAndJobName/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    console.log("[PROXY] suggested data", data);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}
