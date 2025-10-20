import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

export async function POST(req: Request) {
  console.log("[PROXY] incoming request to /api/validateRNA");

  try {
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("csrfToken")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");

    if (!csrfCookie || csrfCookie !== csrfHeader) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    let backendRes: Response;
    const contentType = req.headers.get("content-type");
    console.log("[PROXY] content-type from client:", contentType);

    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.json();
        console.log("[PROXY] forwarding JSON body:", body);
        backendRes = await fetch(`${BACKEND_URL}/api/validateRNA/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.error("[PROXY] error parsing JSON:", e);
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    } else if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      console.log("[PROXY] forwarding multipart form entries:", [...form.entries()]);
      backendRes = await fetch(`${BACKEND_URL}/api/validateRNA/`, {
        method: "POST",
        body: form,
      });
    } else {
      console.warn("[PROXY] unsupported content-type:", req.headers.get("content-type"));
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }


    console.log("[PROXY] backend status:", backendRes.status);
    console.log("[PROXY] backend content-type:", backendRes.headers.get("content-type"));

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}

