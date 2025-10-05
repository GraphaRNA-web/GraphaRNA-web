import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

export async function GET(req: Request) {
  console.log("[PROXY] incoming request to /api/getSuggestedData");

  try {
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("csrfToken")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    console.log("[PROXY] csrfCookie:", csrfCookie);
    console.log("[PROXY] csrfHeader:", csrfHeader);
    console.log("[PROXY] origin:", origin);
    console.log("[PROXY] referer:", referer);

    if (!csrfCookie || csrfCookie !== csrfHeader) {
      console.warn("[PROXY] CSRF mismatch");
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      console.warn("[PROXY] Forbidden origin/referer");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const res = await fetch(`${BACKEND_URL}/api/getSuggestedSeedAndJobName/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    console.log("[PROXY] backend status:", res.status);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}

