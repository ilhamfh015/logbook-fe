export const REJECTION_REASON_MAX = 1000;

export function validateRejectionReason(value: string): string | null {
  const reason = value.trim();
  if (!reason) {
    return "Alasan penolakan wajib diisi.";
  }

  if (reason.length > REJECTION_REASON_MAX) {
    return "Alasan penolakan paling banyak 1000 karakter.";
  }

  return null;
}