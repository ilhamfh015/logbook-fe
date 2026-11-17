import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Halaman tidak ditemukan"
      message="Alamat yang kamu buka tidak tersedia. Periksa alamatnya atau kembali ke beranda."
    />
  );
}