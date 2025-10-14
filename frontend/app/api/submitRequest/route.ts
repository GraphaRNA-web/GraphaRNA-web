import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const DOMAIN_URL = process.env.DOMAIN_URL || "http://localhost:3000";

export async function POST(req: Request) {
  console.log("[PROXY] incoming request to /api/submitRequest");

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

    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      // FormData
      const form = await req.formData();

      const email = form.get("email");
      if (typeof email === "string" && email.trim() === "") {
        form.delete("email");
      }

      console.log("[PROXY] forwarding multipart form entries:", [...form.entries()]);
      backendRes = await fetch(`${BACKEND_URL}/api/postRequestData/`, {
        method: "POST",
        body: form,
      });
    } else {
      // JSON
      const body = await req.json();
      console.log("[PROXY] forwarding JSON body (before cleanup):", body);

      if (body.email === "") {
        delete body.email;
      }

      console.log("[PROXY] forwarding JSON body (after cleanup):", body);

      if (!body.fasta_raw) {
        return NextResponse.json(
          { success: false, error: "Missing RNA data (fasta_raw)" },
          { status: 400 }
        );
      }
      if (body.fasta_raw && body.fasta_file) {
        return NextResponse.json(
          { success: false, error: "Unable to process both fasta_raw and fasta_file)" },
          { status: 400 }
        );
      }
      if (body.fasta_raw && typeof body.fasta_raw !== "string") {
        return NextResponse.json(
          { success: false, error: "fasta_raw must be a string" },
          { status: 400 }
        );
      }

      const allowedKeys = [
        "fasta_raw",
        "fasta_file",
        "seed",
        "job_name",
        "email",
        "alternative_conformations",
      ];
      for (const key of Object.keys(body)) {
        if (!allowedKeys.includes(key)) {
          return NextResponse.json(
            { success: false, error: `Unexpected field: ${key}` },
            { status: 400 }
          );
        }
      }

      backendRes = await fetch(`${BACKEND_URL}/api/postRequestData/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

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
