"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, Upload, Info, FileSpreadsheet } from "lucide-react";
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

  const handleDownloadTemplate = () => {
    const csvContent = "email,nama,jenis,email_atasan,admin,password\n" +
                       "contoh@email.com,Nama Pengguna,USER,atasan@email.com,false,password123";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_impor_pengguna.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Impor Pengguna
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-sm font-medium text-brand hover:text-blue-700"
                  >
                    <Download size={16} />
                    Unduh Template
                  </button>
                </div>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Unggah file CSV untuk menambahkan atau memperbarui data pengguna secara massal.
              </p>

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Format kolom (urutkan):
                </p>
                <code className="mt-2 block rounded bg-white px-3 py-2 text-xs text-slate-600 border border-slate-200">
                  email, nama, jenis, email_atasan, admin, password
                </code>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Upload size={32} className="text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {selectedFile ? selectedFile.name : "Belum ada file dipilih"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Maksimum 5MB, format .csv
                </p>

                <input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleChooseFile}
                  className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  {selectedFile ? "Ganti File" : "Pilih File"}
                </button>
              </div>

              <div className="mt-6 flex justify-end">
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
