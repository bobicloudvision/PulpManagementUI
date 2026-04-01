import { ApiErrorResponse } from "./types";

export async function readApiDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (body.detail) {
      return body.detail;
    }
  } catch {
    // Ignore parsing failure and fallback to status text.
  }

  return response.statusText || "Unexpected server error.";
}
