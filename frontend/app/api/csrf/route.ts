// app/api/csrf/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const csrf = cookieStore.get("csrfToken")?.value || null;

  return NextResponse.json({ csrfToken: csrf });
}
