/**
 * Server HTTP Portabel Rekapitulasi Suara OSIS
 * Dibangun menggunakan pustaka standar Node.js (Zero-Dependency)
 * Mengikuti prinsip The Ponytail Ladder: Ringan, Cepat, dan Andal.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port server (dapat diubah via variabel lingkungan PORT atau default 3000)
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Kamus MIME Types untuk penyajian berkas statis
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8'
};

/**
 * Membuat instance server HTTP
 */
const server = http.createServer((req, res) => {
  // Hanya layani metode GET dan HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Metode tidak diizinkan.');
    return;
  }

  // Bersihkan dan normalisasi path URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let safePath = path.normalize(decodeURIComponent(parsedUrl.pathname));
  
  // Arahkan root path '/' ke 'index.html'
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  // Tentukan path absolut di sistem berkas
  const filePath = path.join(__dirname, safePath);

  // Pagar keamanan: Cegah Directory Traversal Attack
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Akses terlarang.');
    return;
  }

  // Periksa keberadaan berkas
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="id">
        <head><meta charset="UTF-8"><title>404 - Halaman Tidak Ditemukan</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 4rem;">
          <h2>404 - Halaman Tidak Ditemukan</h2>
          <p>Berkas yang Anda tuju tidak tersedia di server.</p>
          <a href="/">Kembali ke Aplikasi Rekapitulasi</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Header HTTP standar
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    // Alirkan isi berkas ke response secara efisien (Stream)
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    readStream.on('error', (streamErr) => {
      console.error('Error saat streaming berkas:', streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      }
      res.end('Terjadi kesalahan internal server.');
    });
  });
});

/**
 * Menjalankan server pada port yang ditentukan
 * @param {number} port - Port yang akan digunakan
 */
function jalankanServer(port) {
  server.listen(port, () => {
    console.log(`\n===========================================================`);
    console.log(`🚀 Aplikasi Rekapitulasi Suara OSIS Siap Digunakan!`);
    console.log(`📍 URL Lokal : http://localhost:${port}`);
    console.log(`📍 URL Jaringan TPS : http://127.0.0.1:${port}`);
    console.log(`===========================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} sedang digunakan. Beralih ke port ${port + 1}...`);
      jalankanServer(port + 1);
    } else {
      console.error('❌ Gagal menjalankan server:', err);
      process.exit(1);
    }
  });
}

// Mulai dengarkan koneksi
jalankanServer(DEFAULT_PORT);
