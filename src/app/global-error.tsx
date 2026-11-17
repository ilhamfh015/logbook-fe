"use client";

import { useEffect, useRef } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { logger } from "@/lib/logger";

type GlobalErrorProps = {
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

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const hasLogged = useRef(false);
  const loggedError = useRef<unknown>(undefined);

  useEffect(() => {
    if (hasLogged.current && Object.is(loggedError.current, error)) return;
    hasLogged.current = true;
    loggedError.current = error;
    logger.error("render-global", error, {
      digest: getDigest(error),
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <ErrorFallback
          title="Aplikasi mengalami kendala"
          message="Terjadi kendala saat menampilkan aplikasi. Kendala sudah dicatat. Coba lagi, atau kembali ke beranda."
          onRetry={reset}
          errorCode={getDigest(error)}
        />
      </body>
    </html>
  );
}