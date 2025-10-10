import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.ORIGIN_URL || "http://localhost:3000";

export async function GET(req: Request) {
  console.log("[PROXY] incoming request to /api/downloadZip");
  try {
    const { searchParams } = new URL(req.url);
    const uidh = searchParams.get("uidh");

    // CSRF check
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("csrfToken")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    if (!csrfCookie || csrfCookie !== csrfHeader) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    // Origin / Referer check
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!uidh) {
      return NextResponse.json(
        { success: false, error: "Missing uidh param" },
        { status: 400 }
      );
    }

    // Forward request to Django backend
    const res = await fetch(`${BACKEND_URL}/api/downloadZip/?uidh=${uidh}`, {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="result-${uidh}.zip"`,
      },
    });
  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}
