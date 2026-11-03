export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
    let message = `Terjadi kesalahan (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        const errorBody = body as { message?: unknown; error?: unknown };
        if (typeof errorBody.message === "string") message = errorBody.message;
        else if (typeof errorBody.error === "string") message = errorBody.error;
      }
    } catch {
      // Response tanpa body JSON; pakai pesan default.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
