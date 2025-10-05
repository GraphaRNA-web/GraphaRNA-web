// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get("csrfToken")) {
    res.cookies.set("csrfToken", crypto.randomUUID(), {
        httpOnly: true,
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });
  }

  return res;
}
