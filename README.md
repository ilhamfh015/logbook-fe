# Logbook Frontend

Frontend aplikasi Logbook berbasis Next.js, React, TypeScript, App Router, dan Tailwind CSS.

## Teknologi

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest untuk unit testing
- Playwright untuk end-to-end testing

## Struktur Proyek

```text
src/
├── app/          # Halaman, routing, dan route handler
├── components/   # Komponen antarmuka dan komponen domain
├── lib/          # Utilitas, logger, validasi, dan logika pendukung
├── services/     # API client dan layanan autentikasi
├── styles/       # Styling aplikasi
├── test/         # Konfigurasi dan kebutuhan testing
├── types/        # Definisi tipe TypeScript
└── proxy.ts      # Pemeriksaan cookie pada routing
```

## Konfigurasi Environment

Konfigurasi environment tersedia melalui file `.env.example`.

```env
API_PROXY_TARGET=http://localhost:8080
```

`API_PROXY_TARGET` digunakan untuk menentukan alamat backend API. Jika variabel tersebut tidak diatur, frontend menggunakan `http://localhost:8080` sebagai default.

Next.js meneruskan request dengan pola `/api/:path*` ke backend yang dikonfigurasi.

## Menjalankan Aplikasi

Instal dependency:

```bash
npm install
```

Jalankan aplikasi dalam mode development:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Perintah Development

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run build` | Membuat build production |
| `npm run start` | Menjalankan server production |
| `npm run lint` | Memeriksa kode menggunakan ESLint |
| `npm run test` | Menjalankan unit test Vitest |
| `npm run test:e2e` | Menjalankan end-to-end test Playwright |

## Logging

Frontend menggunakan logger terpusat pada `src/lib/logger.ts`.

Logging mendukung level:

- `debug`
- `info`
- `warn`
- `error`

Log frontend dapat dikirim ke endpoint `/logbook-log` dan disimpan pada file `logs/fe.log` melalui route handler.

Log disimpan dalam format JSON per baris dan mencakup informasi seperti waktu, level, event, request ID, dan context.

Logger juga mendukung:

- Pengaturan level log melalui `NEXT_PUBLIC_LOG_LEVEL`.
- Penyaringan dan sanitasi data sensitif.
- Pengurangan log duplikat.
- Pembatasan jumlah pengiriman log.
- Penanganan kegagalan pengiriman log agar tidak mengganggu alur aplikasi.

### Proteksi Endpoint Logging

Endpoint `/logbook-log` menerapkan beberapa validasi:

- Header `X-Requested-With: XMLHttpRequest`.
- Validasi origin apabila header origin tersedia.
- Rate limit maksimal 60 request dalam 60 detik per key client.
- Batas payload maksimal 16 KB.
- Validasi payload JSON dan event.
- Sanitasi context sebelum disimpan.

### Sanitasi Data

Proses redaksi log dilakukan melalui `src/lib/logRedaction.ts`.

Data sensitif yang terdeteksi berdasarkan nama key akan disembunyikan, termasuk informasi password, token, authorization, cookie, session, secret, serta sejumlah field lain yang berpotensi sensitif.

Sanitasi juga menerapkan:

- Pembatasan kedalaman objek.
- Pembatasan jumlah elemen array.
- Pembatasan panjang string.
- Penanganan circular reference.
- Penyamaran email.
- Penghapusan query dan fragment dari path melalui fungsi `stripQuery`.

## Autentikasi

Layanan autentikasi frontend berada pada `src/services/authService.ts`.

Layanan tersebut berkomunikasi dengan endpoint backend terkait:

- `POST /api/auth/login`
- `POST /api/auth/change-password`
- `GET /api/auth/me`
- `GET /api/auth/roles`
- `POST /api/auth/logout`

Frontend mengelola informasi pengguna yang diperoleh dari API, termasuk roles, status akun, dan status kewajiban penggantian password.

## Session dan Routing

Pemeriksaan routing frontend dilakukan melalui `src/proxy.ts`.

Frontend memeriksa keberadaan cookie `LOGBOOK_SESSION` pada route yang termasuk matcher proxy.

- Route `/login` tetap dapat diakses.
- Pengguna tanpa cookie session diarahkan ke `/login`.
- Route API dan beberapa resource Next.js tidak termasuk dalam matcher pemeriksaan tersebut.

API client menggunakan `credentials: "include"` untuk menyertakan cookie dalam request.

Pemeriksaan cookie pada frontend bukan pengganti validasi autentikasi dan otorisasi oleh backend.

## Penggantian Password Pertama Kali

Pengguna yang diwajibkan mengganti password akan diarahkan ke `/change-password`.

Frontend menangani flag `mustChangePassword` dan kondisi response API dengan kode `PASSWORD_CHANGE_REQUIRED`.

Endpoint terkait:

- `POST /api/auth/login`
- `POST /api/auth/change-password`

## Unit Testing

Unit test dijalankan menggunakan Vitest:

```bash
npm run test
```

## End-to-End Testing

End-to-end test dijalankan menggunakan Playwright:

```bash
npm run test:e2e
```

## Catatan

File environment yang berisi konfigurasi lokal atau informasi sensitif tidak boleh dibagikan ke repository secara sembarangan.

Akun demo dan konfigurasi khusus development tidak ditujukan untuk lingkungan production.
