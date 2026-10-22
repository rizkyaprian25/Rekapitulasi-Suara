# QuickCount OSIS — Web Rekapitulasi & Perhitungan Suara Pemilihan OSIS

Aplikasi web modern, cepat, dan mandiri (*zero-dependency*) untuk rekapitulasi dan perhitungan perolehan suara pemilihan Ketua & Wakil Ketua OSIS secara langsung (*real-count*).

Dirancang khusus untuk operator TPS, saksi, dan panitia KPPS OSIS dengan antarmuka taktil berbasis prinsip **Apple Human Interface Guidelines (HIG)** dan bebas dari *bloatware*.

---

## 🌟 Fitur Utama

1. **Tambah & Kelola Kandidat Dinamis:**
   - Tambah pasangan calon (Nomor Urut, Nama Ketua & Wakil, Kelas, Visi/Slogan).
   - Pemilihan palet warna tema aksen kartu paslon.
   - Penomoran urut otomatis dan pencegahan duplikasi nomor paslon.

2. **Hitung Suara Sekali Klik (+1 Suara Taktil):**
   - Tombol hitung suara super responsif dengan target sentuh besar.
   - Umpan balik audio sintetis lonceng klik via **Web Audio API** bawaan browser (tanpa aset file audio eksternal).
   - Umpan balik haptik (*vibration*) saat dioperasikan di smartphone/tablet panitia.
   - Pilihan tambah cepat (+5 dan +10 suara).

3. **Kalkulasi & Persentase Real-Time:**
   - Perhitungan persentase perolehan suara otomatis berformat angka tabular.
   - Bilah kemajuan (*progress bar*) visual sesuai warna tema paslon.
   - Lencana penanda otomatis paslon yang sedang unggul (*leading candidate*).

4. **Tombol Pembatalan Cepat (Undo Action):**
   - Bilah mengambang (*floating bar*) untuk membatalkan suara terakhir jika petugas salah dengar atau salah klik.

5. **Pencatatan Surat Suara Tidak Sah / Rusak:**
   - Menjamin akuntabilitas total surat suara yang masuk di TPS.

6. **Penyimpanan Lokal Otomatis (LocalStorage Persistence):**
   - Data suara tersimpan aman di peramban, tidak hilang saat halaman di-refresh atau koneksi terputus.

7. **Pintasan Keyboard Cepat (Keyboard Shortcuts):**
   - Tekan tombol angka `1`, `2`, `3` ... pada keyboard untuk langsung menambah suara paslon terkait.
   - Tekan `U` atau `Ctrl+Z` untuk membatalkan suara terakhir.

8. **Cetak Berita Acara Resmi (Print to PDF):**
   - Format cetak formal yang rapi, lengkap dengan kop KPPS OSIS, tabel perolehan suara sah/rusak, dan kolom tanda tangan saksi serta Pembina OSIS.

---

## 🚀 Cara Menjalankan

Aplikasi ini menggunakan modul bawaan (*Standard Library*) Node.js, sehingga **tidak memerlukan instalasi dependensi pihak ketiga (Zero `npm install` needed)**.

### 1. Menjalankan Server Lokal
Pastikan Node.js telah terpasang di komputer, kemudian jalankan:

```bash
npm start
```
*atau:*
```bash
node server.js
```

### 2. Membuka di Browser
Buka browser favorit Anda dan akses:
```
http://localhost:3000
```

---

## 📂 Struktur Proyek

```text
Rekapitulasi Suara/
├── index.html                  # Halaman utama aplikasi & cetak berita acara
├── server.js                   # Server HTTP standar Node.js (Zero-dependency)
├── package.json                # Konfigurasi proyek & skrip eksekusi
├── .env.example                # Template konfigurasi variabel lingkungan
├── .gitignore                  # Pagar pengaman repositori bersih
├── test/
│   └── smoke-test.js           # Pengujian otomatis kontrak data & kalkulasi
└── src/
    ├── app.js                  # Orkestrasi state & antarmuka utama
    ├── contracts/
    │   └── electionContract.js # SSOT skema data & aturan validasi paslon
    ├── core/
    │   ├── audioFeedback.js    # Umpan balik audio & haptik sintetis
    │   └── storage.js          # Pengelola persistensi LocalStorage
    ├── features/
    │   └── tally/
    │       └── tallyEngine.js  # Mesin logika hitung & kalkulasi persentase
    └── styles/
        └── main.css            # Desain token Apple HIG & print stylesheet
```

---

## 🧪 Menjalankan Pengujian (Quality Gate)

Untuk menjalankan uji konsistensi matematika dan kontrak data:

```bash
npm test
```

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT.
