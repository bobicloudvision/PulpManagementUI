import { pulpErrorDetailFromBody } from "@/lib/pulp";

export async function readApiDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as unknown;
    const formatted = pulpErrorDetailFromBody(body);
    if (formatted) {
      return formatted;
    }
  } catch {
    // Ignore parsing failure and fallback to status text.
  }

  return response.statusText || "Unexpected server error.";
}
