// app/api/downloadZip/route.ts
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
  // Add other headers to forward if needed
  return headers;
}

export async function GET(req: Request) {
  const endpoint = "/api/downloadZip";
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
    const uidh = searchParams.get("uidh");

    if (!uidh) {
      return NextResponse.json({ success: false, error: "Missing uidh param" }, { status: 400 });
    }

    const headersToForward = forwardHeaders(req);
    const backendUrl = `${BACKEND_URL}${endpoint}?${searchParams.toString()}`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: headersToForward,
    });

    if (!backendRes.ok) {
      const text = await backendRes.text();
      // Forward error response headers
      const responseHeaders = new Headers(backendRes.headers);
      responseHeaders.delete('transfer-encoding');
      return new NextResponse(text, { status: backendRes.status, headers: responseHeaders });
    }

    const buffer = await backendRes.arrayBuffer();
    // Forward success response headers, adding specific ones for download
    const responseHeaders = new Headers(backendRes.headers);
    responseHeaders.delete('transfer-encoding');
    responseHeaders.set('Content-Type', 'application/zip');
    responseHeaders.set('Content-Disposition', `attachment; filename="result-${uidh}.zip"`);
    
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
        responseHeaders.set("set-cookie", setCookie);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (err: any) {
    console.error("[PROXY] proxy error", err);
    return NextResponse.json(
      { success: false, error: "Proxy error: " + err.message },
      { status: 500 }
    );
  }
}