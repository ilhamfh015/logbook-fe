"use client";

import { useEffect, useRef } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { logger } from "@/lib/logger";

type ErrorProps = {
  error: unknown;
  reset: () => void;
};

function getDigest(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    return error.digest;
  }
  return undefined;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const hasLogged = useRef(false);
  const loggedError = useRef<unknown>(undefined);

  useEffect(() => {
    if (hasLogged.current && Object.is(loggedError.current, error)) return;
    hasLogged.current = true;
    loggedError.current = error;
    logger.error("render", error, {
      digest: getDigest(error),
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <ErrorFallback
      title="Halaman tidak dapat ditampilkan"
      message="Terjadi kendala saat menampilkan halaman ini. Kendala sudah dicatat. Coba lagi, atau kembali ke beranda."
      onRetry={reset}
      errorCode={getDigest(error)}
    />
  );
}