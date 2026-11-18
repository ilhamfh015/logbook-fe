"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";

type ErrorFallbackProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  homeHref?: string;
  errorCode?: string;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
  backgroundColor: "#F5F7FA",
  color: "#1F2633",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  padding: 32,
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  backgroundColor: "#FFFFFF",
  boxShadow: "0 1px 3px rgba(31, 38, 51, 0.08)",
};

const actionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

export function ErrorFallback({
  title,
  message,
  onRetry,
  homeHref = "/",
  errorCode,
}: ErrorFallbackProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main style={pageStyle}>
      <section role="alert" style={panelStyle}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          style={{ margin: 0, fontSize: 24, lineHeight: 1.3, fontWeight: 700 }}
        >
          {title}
        </h1>
        <p style={{ margin: "12px 0 0", color: "#475569", fontSize: 15, lineHeight: 1.6 }}>
          {message}
        </p>
        {errorCode ? (
          <p style={{ margin: "12px 0 0", color: "#64748B", fontSize: 12 }}>
            Kode: {errorCode}
          </p>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              style={{
                ...actionStyle,
                border: "1px solid #0A6FD6",
                backgroundColor: "#0A6FD6",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
          ) : null}
          <Link
            href={homeHref}
            style={{
              ...actionStyle,
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
            }}
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}