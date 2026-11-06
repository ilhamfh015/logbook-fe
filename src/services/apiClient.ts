export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login" && typeof window !== "undefined") {
      window.dispatchEvent(new Event("logbook:unauthorized"));
    }

    let message = `Terjadi kesalahan (${response.status})`;
    let fieldErrors: Record<string, string> = {};
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        const errorBody = body as { message?: unknown; error?: unknown; fieldErrors?: unknown };
        if (typeof errorBody.message === "string") message = errorBody.message;
        else if (typeof errorBody.error === "string") message = errorBody.error;

        if (errorBody.fieldErrors && typeof errorBody.fieldErrors === "object") {
          fieldErrors = Object.fromEntries(
            Object.entries(errorBody.fieldErrors).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          );
        }
      }
    } catch {
      // Response tanpa body JSON; pakai pesan default.
    }
    throw new ApiError(response.status, message, fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
