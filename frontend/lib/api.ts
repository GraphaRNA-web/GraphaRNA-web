// lib/api.ts
async function fetchApiProxy(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}


export async function validateRNA(params: { fasta_raw?: string; fasta_file?: File }) {
  console.log("[validateRNA] sending to /api/validateRNA", params);

  let body: BodyInit;
  const headers: Record<string, string> = {};

  if (params.fasta_file) {
    const form = new FormData();
    form.append("fasta_file", params.fasta_file, params.fasta_file.name);
    body = form;
  } else {
    body = JSON.stringify({ fasta_raw: params.fasta_raw });
    headers["Content-Type"] = "application/json";
  }

  const res = await fetchApiProxy("/api/validateRNA", { 
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

export async function getSuggestedData(exampleNumber: number): Promise<SuggestedData> {
  let url = "/api/getSuggestedData";
  
  if (exampleNumber !== 0) {
    const params = new URLSearchParams({ 
      example_number: exampleNumber.toString() 
    });
    url += `?${params.toString()}`;
  }
  const res = await fetchApiProxy(url, {

    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
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

  const headers: Record<string, string> = {};
  let body: BodyInit;

  if (params.fasta_file) {
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

  const res = await fetchApiProxy("/api/submitRequest", {
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

export async function submitExampleJobRequest(params: {
  fasta_raw?: string;
  fasta_file?: File;
  email?: string;
  example_number: number;
}) {
  console.log("[submitExampleJobRequest] sending to /api/submitExampleRequest", params);

  const headers: Record<string, string> = {};
  let body: BodyInit;

  if (params.fasta_file) {
    const form = new FormData();
    form.append("fasta_file", params.fasta_file, params.fasta_file.name);
    if (params.fasta_raw) form.append("fasta_raw", params.fasta_raw);
    if (params.email) form.append("email", params.email);
    if (params.example_number !== undefined) form.append("example_number", String(params.example_number));
    body = form;
  } else {
    const json: any = { ...params };
    delete json.fasta_file;
    body = JSON.stringify(json);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetchApiProxy("/api/submitExampleRequest", {
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

  const res = await fetchApiProxy(`/api/getResultDetails?uidh=${encodeURIComponent(params.uidh)}`, {
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

export async function downloadZip(params: { uidh: string }) {
  console.log("[downloadZip] sending request to proxy", params);

  const res = await fetchApiProxy(`/api/downloadZip?uidh=${encodeURIComponent(params.uidh)}`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Could not download ZIP");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `result-${params.uidh}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getActiveJobs(params: { page: string }): Promise<any> {
  console.log("[getActiveJobs] sending request to proxy");

  const res = await fetchApiProxy(`/api/getActiveJobs?page=${encodeURIComponent(params.page)}`, { 
    method: "GET"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not fetch active jobs");
  }

  return res.json();
}

export async function getFinishedJobs(params: { page: string }): Promise<any> {
  console.log("[getFinishedJobs] sending request to proxy");

  const res = await fetchApiProxy(`/api/getFinishedJobs?page=${encodeURIComponent(params.page)}`, {
    method: "GET"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not fetch finished jobs");
  }

  return res.json();
}