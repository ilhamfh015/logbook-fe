import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Log Book",
  description: "Catatan pekerjaan harian talent Padepokan",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
