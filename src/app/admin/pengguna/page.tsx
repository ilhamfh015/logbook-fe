"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ImportResult } from "@/components/admin/ImportResult";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/services/apiClient";
import { adminService, type AdminImportResponse } from "@/services/adminService";

export default function PenggunaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<AdminImportResponse | null>(
    null,
  );

  const resetResult = () => {
    setErrorMessage("");
    setImportResult(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      resetResult();
      alert("File harus berformat CSV.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    resetResult();
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    resetResult();

    if (selectedFile.size === 0) {
      setErrorMessage("File CSV tidak boleh kosong.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await adminService.importUsers(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setImportResult(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Impor gagal. Silakan coba lagi.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleFinish = () => {
    setSelectedFile(null);
    resetResult();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-surface px-5 py-12 text-ink">
        <p className="mx-auto max-w-3xl text-sm text-slate-600">
          Memeriksa akses admin...
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-surface px-5 py-12 text-ink">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Halaman ini hanya dapat diakses oleh Admin.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar activeItem="pengguna" />

        <section className="min-w-0 flex-1">
          <AppHeader />

          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-brand">ADMIN</p>

              <h1 className="text-2xl font-bold">Pengguna Impor CSV</h1>

              <p className="mt-2 text-sm text-slate-500">
                Kelola data pengguna melalui file CSV.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Unggah file CSV</h2>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="csv-file"
                    className="mb-2 block text-sm font-medium"
                  >
                    Pilih file CSV
                  </label>

                  <input
                    ref={fileInputRef}
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex min-h-[90px] items-center gap-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {selectedFile
                          ? selectedFile.name
                          : "Belum ada file dipilih"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB · CSV`
                          : "Pilih file CSV dengan format UTF-8"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-700">
                    Kolom wajib, urut:
                  </p>

                  <code className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    email,nama,jenis,email_atasan,admin,password
                  </code>

                  <p className="mt-2 text-xs text-slate-500">
                    Kolom password wajib minimal 6 karakter. Impor ulang
                    memperbarui data dan password pengguna yang masih memakai
                    password sementara; password yang sudah diganti tidak
                    ditimpa.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleChooseFile}
                  disabled={isImporting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {selectedFile ? "Pilih file lain" : "Pilih file"}
                </button>

                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={!selectedFile || isImporting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isImporting ? "Memvalidasi dan mengimpor..." : "Validasi dan impor"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
              >
                <p className="font-semibold">Impor gagal</p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            ) : null}

            {importResult ? (
              <ImportResult
                created={importResult.created}
                updated={importResult.updated}
                importedEmails={importResult.importedEmails ?? []}
                onFinish={handleFinish}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
