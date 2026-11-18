import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import ErrorPage from "@/app/error";

const { loggerError } = vi.hoisted(() => ({ loggerError: vi.fn() }));

vi.mock("@/lib/logger", () => ({
  logger: { error: loggerError },
}));

describe("ErrorFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the supplied title and message and moves focus to the heading", () => {
    render(<ErrorFallback title="Judul bantuan" message="Pesan bantuan" />);

    const heading = screen.getByRole("heading", { name: "Judul bantuan" });
    expect(heading).toHaveFocus();
    expect(screen.getByText("Pesan bantuan")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is activated", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorFallback title="Gangguan" message="Coba kembali." onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when onRetry is not provided", () => {
    render(<ErrorFallback title="Tidak ditemukan" message="Alamat tidak tersedia." />);

    expect(screen.queryByRole("button", { name: "Coba lagi" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke beranda" })).toHaveAttribute("href", "/");
  });

  it("shows the supplied error code", () => {
    render(<ErrorFallback title="Gangguan" message="Coba kembali." errorCode="abc123" />);

    expect(screen.getByText("Kode: abc123")).toBeInTheDocument();
  });

  it("logs the digest and pathname once without exposing the error message", async () => {
    const error = Object.assign(new Error("rahasia teknis"), { digest: "digest-456" });
    const reset = vi.fn();
    window.history.replaceState({}, "", "/halaman?token=jangan-dicatat");

    render(<ErrorPage error={error} reset={reset} />);

    expect(screen.queryByText("rahasia teknis")).not.toBeInTheDocument();
    await waitFor(() => expect(loggerError).toHaveBeenCalledOnce());
    expect(loggerError).toHaveBeenCalledWith("render", error, {
      digest: "digest-456",
      path: "/halaman",
    });
  });
});