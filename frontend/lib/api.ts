export async function fetchWithCsrf(input: RequestInfo, init: RequestInit = {}) {
  let csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  if (!csrf) {
    const res = await fetch("/api/csrf", { credentials: "include" });
    const data = await res.json();
    csrf = data.csrfToken;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (meta) meta.content = csrf;
  }

  const mergedHeaders = {
    ...(init.headers || {}),
    "x-csrf-token": csrf || "",
  };

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
    credentials: "include",
  });
}

export async function validateRNA(params: { fasta_raw?: string; fasta_file?: File }) {
  console.log("[validateRNA] sending to /api/validateRNA", params);

  let body: BodyInit;
  const headers: Record<string, string> = {};

  if (params.fasta_file) {
    // multipart/form-data
    const form = new FormData();
    form.append("fasta_file", params.fasta_file, params.fasta_file.name);
    body = form;
  } else {
    // JSON
    body = JSON.stringify({ fasta_raw: params.fasta_raw });
    headers["Content-Type"] = "application/json";
  }

  const res = await fetchWithCsrf("/api/validateRNA", {
    method: "POST",
    headers,
    body,
  });

  console.log("[validateRNA] response status", res.status);
  const data = await res.json();
  console.log("[validateRNA] parsed data", data);
  return data;
}




export type SuggestedData = { seed: number; job_name: string };

export async function getSuggestedData(): Promise<SuggestedData> {
  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-csrf-token": csrf || "",
  };

  const res = await fetchWithCsrf("/api/getSuggestedData", {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not get suggested Job Data");
  }

  return res.json();
}


export async function submitJobRequest(params: {
  fasta_raw?: string;
  fasta_file?: File;
  seed: number;
  job_name: string;
  email?: string;
  alternative_conformations?: number;
}) {
  console.log("[submitJobRequest] sending to /api/submitRequest", params);

  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  const headers: Record<string, string> = { "x-csrf-token": csrf || "" };

  let body: BodyInit;
  if (params.fasta_file) {
    // Multipart upload (plik)
    const form = new FormData();
    form.append("fasta_file", params.fasta_file, params.fasta_file.name);
    if (params.fasta_raw) form.append("fasta_raw", params.fasta_raw);
    if (params.seed !== undefined) form.append("seed", String(params.seed));
    if (params.job_name) form.append("job_name", params.job_name);
    if (params.email) form.append("email", params.email);
    if (params.alternative_conformations !== undefined)
      form.append("alternative_conformations", String(params.alternative_conformations));
    body = form;
  } else {
    const json: any = { ...params };
    delete json.fasta_file;
    body = JSON.stringify(json);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetchWithCsrf("/api/submitRequest", {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Could not submit job request");
  }

  return res.json();
}



export async function getResultDetails(params: { uidh: string }) {
  console.log("[getResultDetails] sending request to proxy", params);

  const res = await fetchWithCsrf(`/api/getResults?uidh=${encodeURIComponent(params.uidh)}`, {
    method: "GET",
  });

  console.log("[getResultDetails] response status", res.status);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not fetch job results");
  }

  const data = await res.json();
  console.log("[getResultDetails] parsed data", data);

  return data;
}

export async function getActiveJobs(): Promise<any> {
  console.log("[getActiveJobs] sending request to proxy");

  const res = await fetchWithCsrf("/api/getActiveJobs", { method: "GET" });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not fetch active jobs");
  }

  return res.json();
}

export async function getFinishedJobs(): Promise<any> {
  console.log("[getFinishedJobs] sending request to proxy");

  const res = await fetchWithCsrf("/api/getFinishedJobs", { method: "GET" });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not fetch finished jobs");
  }

  return res.json();
}