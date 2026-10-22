/**
 * Kontrak Data & Single Source of Truth (SSOT) Pemilihan OSIS
 * Mendefinisikan struktur data kandidat, konfigurasi pemilihan, dan aturan validasi.
 */

// Pilihan palet warna tema kandidat standar yang elegan dan kontras
export const TEMA_WARNA_KANDIDAT = [
  { id: 'blue', label: 'Biru Safir', hex: '#2563eb', bgSoft: '#eff6ff', border: '#bfdbfe' },
  { id: 'emerald', label: 'Hijau Zamrud', hex: '#059669', bgSoft: '#ecfdf5', border: '#a7f3d0' },
  { id: 'amber', label: 'Kuning Amber', hex: '#d97706', bgSoft: '#fffbeb', border: '#fde68a' },
  { id: 'purple', label: 'Ungu Royal', hex: '#7c3aed', bgSoft: '#f5f3ff', border: '#ddd6fe' },
  { id: 'rose', label: 'Merah Mawar', hex: '#e11d48', bgSoft: '#fff1f2', border: '#fecdd3' },
  { id: 'cyan', label: 'Cyan Samudera', hex: '#0891b2', bgSoft: '#ecfeff', border: '#a5f3fc' }
];

// Data awal (mock starter) agar pengguna langsung melihat tampilan visual yang siap digunakan
export const DATA_AWAL_PEMILIHAN = {
  judulPemilihan: 'Pemilihan Ketua & Wakil Ketua OSIS',
  namaSekolah: 'SMPN 3 Cibungbulang',
  tahunPeriode: '2026/2027',
  kandidat: [
    {
      id: 'kandidat-1',
      nomorUrut: 1,
      namaKetua: 'Ahmad Faiz Pratama',
      namaWakil: 'Nadia Salsabila',
      kelasKetua: 'VIII-A',
      kelasWakil: 'VIII-C',
      visi: 'Mewujudkan OSIS SMPN 3 Cibungbulang yang aspiratif, aktif, dan berakhlak mulia.',
      suara: 0,
      warnaTema: '#2563eb'
    },
    {
      id: 'kandidat-2',
      nomorUrut: 2,
      namaKetua: 'Bima Satria Wijaya',
      namaWakil: 'Zahra Putri Ramadhani',
      kelasKetua: 'VIII-B',
      kelasWakil: 'VIII-D',
      visi: 'Membangun sinergi siswa yang kreatif, peduli lingkungan, dan berprestasi.',
      suara: 0,
      warnaTema: '#059669'
    }
  ],
  suaraTidakSah: 0,
  riwayatUndo: []
};

/**
 * Validasi objek kandidat baru sebelum disimpan ke state
 * @param {Object} input - Data input dari form
 * @returns {{ valid: boolean, pesanError?: string, data?: Object }}
 */
export function validasiKandidat(input) {
  if (!input.namaKetua || input.namaKetua.trim() === '') {
    return { valid: false, pesanError: 'Nama Calon Ketua OSIS wajib diisi.' };
  }

  const nomorUrut = parseInt(input.nomorUrut, 10);
  if (isNaN(nomorUrut) || nomorUrut < 1) {
    return { valid: false, pesanError: 'Nomor urut kandidat harus berupa angka positif.' };
  }

  return {
    valid: true,
    data: {
      id: 'kandidat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      nomorUrut: nomorUrut,
      namaKetua: input.namaKetua.trim(),
      namaWakil: (input.namaWakil || '').trim(),
      kelasKetua: (input.kelasKetua || '').trim(),
      kelasWakil: (input.kelasWakil || '').trim(),
      visi: (input.visi || 'Membawa kemajuan bersama untuk OSIS dan almamater.').trim(),
      suara: 0,
      warnaTema: input.warnaTema || TEMA_WARNA_KANDIDAT[0].hex
    }
  };
}
