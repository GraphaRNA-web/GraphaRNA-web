export async function validateRNA(rna: string) {
  console.log("[validateRNA] sending to /api/validateRNA", rna);
  const res = await fetch("/api/validateRNA", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RNA: rna }),
  });
  console.log("[validateRNA] response status", res.status);

  const data = await res.json();
  console.log("[validateRNA] parsed data", data);
  return data;
}


export type SuggestedData = { seed: number; name: string };

export async function getSuggestedData(): Promise<SuggestedData> {
  const res = await fetch("/api/getSuggestedData", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not get suggested Job Data");
  }

  return res.json();
}

export async function submitJobRequest(params: {
  fasta_raw: string;
  seed: number;
  job_name: string;
  email?: string;
  alternative_conformations?: number;
}) {

  const bodyToSend: any = { ...params };
  if (!bodyToSend.email) {
    delete bodyToSend.email;
  }

  console.log("[submitJobRequest] sending request to proxy", params);

  const res = await fetch("/api/submitRequest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyToSend),
  });

  console.log("[submitJobRequest] response status", res.status);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Could not submit job request");
  }

  const data = await res.json();
  console.log("[submitJobRequest] parsed data", data);

  return data;
}