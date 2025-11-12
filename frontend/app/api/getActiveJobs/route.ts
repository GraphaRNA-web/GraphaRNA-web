// app/api/activeJobs/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const domainEnv = process.env.DOMAIN_URL || "http://localhost:3000";
const ALLOWED_DOMAINS = domainEnv.split(',').map(domain => domain.trim());

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
  const endpoint = "/api/activeJobs";
  console.log(`[PROXY] incoming GET to ${req.url}`);

  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    let isAllowed = false;

    if (origin && ALLOWED_DOMAINS.includes(origin)) {
      isAllowed = true;
    }
    
    if (!isAllowed && referer && ALLOWED_DOMAINS.some((domain: string) => referer.startsWith(domain))) {
      isAllowed = true;
    }

    if (!isAllowed) {
      console.warn(`[PROXY] Forbidden origin/referer. Origin: ${origin}, Referer: ${referer}`);
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const headersToForward = forwardHeaders(req);
    const backendUrl = `${BACKEND_URL}${endpoint}?${searchParams.toString()}`;

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