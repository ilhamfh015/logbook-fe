# Logbook Frontend

Frontend Logbook berbasis Next.js, TypeScript, App Router, dan Tailwind CSS sesuai SRS.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Akun demo

Fixture dari `logbook.sql` memakai kata sandi `Logbook@2026` untuk akun:

- `rina.talent@contoh.id`
- `budi.santoso@contoh.id`
- `sari.wulan@contoh.id`
- `admin1@contoh.id`

Kata sandi tersebut hanya untuk lingkungan pengembangan dan harus diganti sebelum dipakai di lingkungan nyata.

## Ganti kata sandi pertama

Pengguna yang diimpor admin mendapat flag `mustChangePassword = true`. Setelah login, frontend mengalihkan pengguna ke `/change-password` dan menolak akses ke halaman lain sampai kata sandi diganti.

Endpoint terkait:

- `POST /api/auth/login` mengembalikan `mustChangePassword`.
- `POST /api/auth/change-password` menerima `currentPassword` dan `newPassword`, lalu menghapus flag tersebut.
- Endpoint API lain mengembalikan `403` dengan kode `PASSWORD_CHANGE_REQUIRED` selama flag masih aktif.

## Unit test

Jalankan unit test dengan Vitest:

```bash
npm test
```

## Struktur awal

- `src/app`: routing App Router
- `src/components`: komponen UI dan domain
- `src/services`: client API dan autentikasi
- `src/hooks`: hook data dan interaksi
- `src/lib`: logika timeline, tanggal, validasi, dan konten statis
- `src/types`: kontrak tipe data
