const SENSITIVE_KEY_PARTS = [
  "password",
  "passwd",
  "katasandi",
  "sandi",
  "token",
  "authorization",
  "cookie",
  "session",
  "secret",
  "summary",
  "ringkasan",
  "obstacle",
  "kendala",
  "body",
];

const MAX_DEPTH = 4;
const MAX_ARRAY_LENGTH = 20;
const MAX_STRING_LENGTH = 500;
const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+)$/i;

export function redactValue(value: unknown, depth = 0): unknown {
  try {
    return redact(value, depth, new WeakSet<object>());
  } catch {
    return "[tidak dapat dibaca]";
  }
}

function redact(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > MAX_DEPTH) return "[terlalu dalam]";

  if (typeof value === "string") {
    const email = EMAIL_PATTERN.exec(value);
    if (email) return `${value[0]}***@${email[1]}`;
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }

  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[melingkar]";
  seen.add(value);

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    let length: number;
    try {
      length = Math.min(value.length, MAX_ARRAY_LENGTH);
      for (let index = 0; index < length; index += 1) {
        result.push(redact(value[index], depth + 1, seen));
      }
    } catch {
      return "[tidak dapat dibaca]";
    }
    return result;
  }

  const result: Record<string, unknown> = {};
  try {
    for (const [key, nestedValue] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      result[key] = SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part))
        ? "[disembunyikan]"
        : redact(nestedValue, depth + 1, seen);
    }
  } catch {
    return "[tidak dapat dibaca]";
  }
  return result;
}

export function stripQuery(path: string): string {
  const delimiterIndex = path.search(/[?#]/);
  return delimiterIndex === -1 ? path : path.slice(0, delimiterIndex);
}