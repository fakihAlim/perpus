# Perpustakaan Digital (Perpus) - Web & Mobile App

Aplikasi Perpustakaan Digital modern yang terbagi menjadi platform **Web Admin/Portal** (Next.js) dan **Mobile Client** (Expo React Native) dengan sistem manajemen peminjaman buku serta publikasi skripsi multi-bab yang aman.

---

## 🚀 Fitur Utama

### 🖥️ Web Portal & Admin (`/web`)
* **Portal Mahasiswa (Light Theme)**:
  * Katalog buku perpustakaan.
  * Manajemen peminjaman & riwayat pengembalian buku.
  * Unggah dokumen skripsi multi-bab (dipecah per bab terpisah, misal Bab 1, Bab 2, dsb).
* **Portal Petugas / Admin (Dark Theme)**:
  * Verifikasi & publikasi skripsi yang diunggah mahasiswa.
  * **Sistem Penguncian Bab**: Admin dapat mengunci bab skripsi tertentu (misal Bab Pembahasan/Hasil) agar hanya bisa dibaca oleh pengguna terdaftar/login.
  * Manajemen Anggota & Akun Tamu (Approval Pendaftaran).
  * Fitur CRUD Katalog Buku & Skripsi dengan proteksi konfirmasi ganda sebelum penghapusan.

### 📱 Mobile Client (`/mobile`)
* **Aplikasi Android/iOS (Expo SDK 56 + React Native)**:
  * Eksplorasi katalog buku & daftar skripsi.
  * Sistem login terintegrasi untuk mahasiswa & akun tamu.
  * **In-App PDF Reader Aman**: Membaca bab skripsi yang tidak terkunci langsung di dalam aplikasi menggunakan WebView + PDF.js engine.
  * **Fitur Zooming**: Mendukung zoom cubit (*pinch-to-zoom*) pada pembaca PDF untuk kenyamanan membaca.
  * **Proteksi Konten**:
    * **Blokir Screenshot**: Layar otomatis hitam/tidak bisa ditangkap (*Screen Capture Disabled*) saat membuka dokumen skripsi menggunakan `expo-screen-capture`.
    * **Blokir Copy-Paste**: Menyalin atau menyeleksi teks dinonaktifkan di area pembaca PDF untuk melindungi hak cipta karya ilmiah.

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Konfigurasi Backend & Web (`/web`)

1. Pindah ke direktori `web`:
   ```bash
   cd web
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi file `.env` di folder `web`. Sesuaikan dengan database Anda (menggunakan SQLite secara default atau MySQL):
   ```env
   DATABASE_URL="file:./dev.db" # Default SQLite
   JWT_SECRET="rahasia_super_aman"
   ```
4. Lakukan sinkronisasi database menggunakan Prisma:
   ```bash
   npx prisma db push
   ```
5. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:3000`. Catat alamat IP lokal komputer Anda (misal: `http://192.168.1.8:3000`) untuk konfigurasi aplikasi mobile.

---

### 2. Konfigurasi Aplikasi Mobile (`/mobile`)

Agar aplikasi mobile dapat berkomunikasi dengan server backend lokal, Anda harus menghubungkannya ke IP komputer host Anda yang berada di jaringan Wi-Fi yang sama.

1. Buka file `mobile/App.tsx` dan cari state `apiHost`:
   ```typescript
   // Ubah IP di bawah ini dengan IP lokal komputer Anda
   const [apiHost, setApiHost] = useState("http://192.168.1.8:3000");
   ```
2. Pindah ke direktori `mobile`:
   ```bash
   cd ../mobile
   ```
3. Instal dependensi mobile:
   ```bash
   npm install
   ```
4. Jalankan aplikasi menggunakan Expo:
   ```bash
   npx expo start
   ```
5. Tekan tombol **`a`** di terminal untuk membukanya di emulator Android / perangkat Android fisik yang terhubung via USB dengan mode USB Debugging aktif.

---

## 🔒 Detail Keamanan & CORS (Cross-Origin Resource Sharing)

Aplikasi mobile memuat file PDF dari server Next.js menggunakan WebView. Untuk menghindari masalah pemuatan lintas domain (CORS), konfigurasi header CORS wildcard telah diterapkan pada Next.js (`web/next.config.ts`) untuk membolehkan request dari asal manapun khusus di folder `/uploads/*`:

```typescript
// web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

Di sisi mobile, screenshot dicegah saat modal PDF aktif terbuka:
```typescript
useEffect(() => {
  // Blokir screenshot saat modal dibuka
  ScreenCapture.preventScreenCaptureAsync();
  
  // Izinkan kembali saat modal ditutup
  return () => { ScreenCapture.allowScreenCaptureAsync(); };
}, []);
```

---

## 📂 Struktur Folder Proyek
```text
Perpus/
├── web/              # Next.js 15 (Backend API, UI Admin, & Portal Web Mahasiswa)
│   ├── prisma/       # Skema Database & Migrasi (Prisma)
│   ├── public/       # Aset statis & berkas PDF unggahan mahasiswa
│   └── src/          # Source Code Aplikasi Web
└── mobile/           # React Native + Expo (Aplikasi Client Mobile Mahasiswa)
    ├── App.tsx       # Alur logika, halaman, & komponen utama aplikasi mobile
    └── package.json  # Manajer Dependensi Mobile (React Native WebView & Screen Capture)
```
