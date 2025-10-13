import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

export async function GET(req: Request) {
  console.log("[PROXY] incoming request to /api/finishedJobs");
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");

    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("csrfToken")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    console.log("[PROXY] csrfCookie:", csrfCookie, "csrfHeader:", csrfHeader);

    if (!csrfCookie || csrfCookie !== csrfHeader) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const res = await fetch(`${BACKEND_URL}/api/finishedJobs?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json({ success: false, error: "Proxy error: " + err.message }, { status: 500 });
  }
}
