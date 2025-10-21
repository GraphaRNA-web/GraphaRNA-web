// app/providers/CsrfProvider.tsx
'use client';

import { useEffect } from "react";

export default function CsrfProvider() {
  useEffect(() => {
    fetch("/api/csrf", { credentials: "include" })
      .then(res => {
        if (!res.ok) {
          throw new Error(`CSRF API failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("[CSRF Provider] got token:", data.csrfToken);
        const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        if (meta) {
            meta.content = data.csrfToken;
            console.log("[CSRF Provider] meta updated:", meta.content);
        }
      })
      .catch(error => {
        console.error("[CSRF Provider] Failed to fetch token:", error);
      });
  }, []);

  return null;
}