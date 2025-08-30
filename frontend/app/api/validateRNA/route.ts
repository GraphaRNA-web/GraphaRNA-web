import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  console.log("[PROXY] incoming request to /api/validateRNA");

  try {
    const body = await req.json();
    console.log("[PROXY] body", body);

    const res = await fetch(`${BACKEND_URL}/api/validateRNA/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("[PROXY] backend status", res.status);
    const data = await res.json();
    console.log("[PROXY] backend data", data);

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}
