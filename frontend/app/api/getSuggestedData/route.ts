// app/api/getSuggestedData/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

function forwardHeaders(req: Request): Headers {
  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  headers.set("Content-Type", "application/json"); // Backend expects JSON
  return headers;
}

export async function GET(req: Request) {
  const endpoint = "/api/getSuggestedSeedAndJobName/"; // Django endpoint
  console.log(`[PROXY] incoming GET to ${req.url}`);

  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const headersToForward = forwardHeaders(req);
    const backendUrl = `${BACKEND_URL}${endpoint}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: headersToForward,
    });

    const responseBody = await backendRes.text();
    const responseHeaders = new Headers(backendRes.headers);
    responseHeaders.delete('transfer-encoding');

    const response = new NextResponse(responseBody, {
      status: backendRes.status,
      headers: responseHeaders,
    });

    return response;

  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}