/**
 * Service Worker untuk Kemampuan Offline & PWA (Progressive Web App)
 * QuickCount OSIS — SMPN 3 Cibungbulang
 */

const NAMA_CACHE = 'quickcount-osis-v1';

// Daftar aset inti yang di-precache agar aplikasi dapat dibuka 100% tanpa internet
const ASET_STATIS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './src/styles/main.css',
  './src/app.js',
  './src/contracts/electionContract.js',
  './src/core/audioFeedback.js',
  './src/core/storage.js',
  './src/features/tally/tallyEngine.js',
  './src/features/backup/backupEngine.js'
];

// Tahap Instalasi Service Worker: Mengunduh dan menyimpan semua berkas ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(NAMA_CACHE).then((cache) => {
      return cache.addAll(ASET_STATIS);
    }).then(() => self.skipWaiting())
  );
});

// Tahap Aktivasi: Membersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((daftarKunci) => {
      return Promise.all(
        daftarKunci.map((kunci) => {
          if (kunci !== NAMA_CACHE) {
            return caches.delete(kunci);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Tahap Pencegatan Request (Fetch): Cache-First dengan Fallback Jaringan
self.addEventListener('fetch', (event) => {
  // Hanya tangani metode GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((responsCache) => {
      if (responsCache) {
        return responsCache;
      }

      // Jika belum ada di cache, ambil dari jaringan lalu simpan salinannya ke cache
      return fetch(event.request).then((responsJaringan) => {
        if (!responsJaringan || responsJaringan.status !== 200 || responsJaringan.type !== 'basic') {
          return responsJaringan;
        }

        const responsKlon = responsJaringan.clone();
        caches.open(NAMA_CACHE).then((cache) => {
          cache.put(event.request, responsKlon);
        });

        return responsJaringan;
      }).catch(() => {
        // Fallback jika offline dan navigasi halaman utama
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
