# Logbook Frontend

Frontend Logbook berbasis Next.js, TypeScript, App Router, dan Tailwind CSS sesuai SRS.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

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
