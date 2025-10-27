// app/api/submitRequest/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

function forwardHeaders(req: Request): Headers {
  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  // Content-Type is set later based on JSON or FormData
  return headers;
}

export async function POST(req: Request) {
  const endpoint = "/api/postRequestData/"; // Django endpoint
  console.log(`[PROXY] incoming POST to ${req.url}`);

  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    if (!(origin === DOMAIN_URL || referer?.startsWith(DOMAIN_URL))) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const headersToForward = forwardHeaders(req);
    let body: BodyInit | null = null;
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const form = await req.formData();
      const email = form.get("email");
      if (typeof email === "string" && email.trim() === "") {
        form.delete("email");
      }
      body = form;
    } else {
      const rawBody = await req.text();
      body = rawBody;
      if (contentType) {
          headersToForward.set("Content-Type", contentType);
      }
      try {
        const jsonBody = JSON.parse(rawBody);
         if (jsonBody.email === "") {
            delete jsonBody.email;
         }
         body = JSON.stringify(jsonBody);
         if (!headersToForward.has('Content-Type')) {
             headersToForward.set('Content-Type', 'application/json');
         }
      } catch (e) {
          console.warn("Could not parse request body as JSON, forwarding raw text", e);
          if (!headersToForward.has('Content-Type') && contentType) {
            headersToForward.set('Content-Type', contentType);
          }
      }
    }

    const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: headersToForward,
      body: body,
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