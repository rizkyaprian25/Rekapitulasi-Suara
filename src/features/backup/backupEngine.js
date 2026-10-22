/**
 * Modul Cadangkan & Pulihkan Data Pemilihan (JSON Backup & Restore Engine)
 * Memungkinkan ekspor data ke berkas .json dan pemulihan data secara aman.
 */

import { validasiKandidat } from '../../contracts/electionContract.js';

/**
 * Menghasilkan string JSON cadangan dari state pemilihan
 * @param {Object} state - State pemilihan saat ini
 * @returns {string} JSON string terformat rapi
 */
export function buatStringBackup(state) {
  const payloadBackup = {
    versiAplikasi: '1.0.0',
    tipe: 'REKAPITULASI_SUARA_OSIS_BACKUP',
    waktuPencadangan: new Date().toISOString(),
    data: {
      judulPemilihan: state.judulPemilihan,
      namaSekolah: state.namaSekolah,
      tahunPeriode: state.tahunPeriode,
      kandidat: state.kandidat,
      suaraTidakSah: state.suaraTidakSah || 0,
      riwayatUndo: state.riwayatUndo || []
    }
  };

  return JSON.stringify(payloadBackup, null, 2);
}

/**
 * Memicu pengunduhan berkas .json di browser pengguna (Zero-Dependency)
 * @param {Object} state - State pemilihan saat ini
 */
export function unduhBerkasJson(state) {
  const jsonString = buatStringBackup(state);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Buat nama berkas deskriptif dengan tanggal hari ini
  const tanggal = new Date().toISOString().slice(0, 10);
  const namaSekolahClean = (state.namaSekolah || 'osis')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const namaBerkas = `cadangan-suara-${namaSekolahClean}-${tanggal}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = namaBerkas;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Memvalidasi dan mem-parsing data JSON yang diunggah untuk dipulihkan
 * @param {string} rawJson - Teks mentah dari berkas JSON
 * @returns {{ valid: boolean, stateBaru?: Object, pesanError?: string }}
 */
export function validasiDanParseBackup(rawJson) {
  if (!rawJson || typeof rawJson !== 'string' || rawJson.trim() === '') {
    return { valid: false, pesanError: 'Berkas JSON kosong atau tidak dapat dibaca.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return { valid: false, pesanError: 'Format berkas rusak. Pastikan berkas adalah file JSON yang valid.' };
  }

  // Dukung format payload berbungkus (payloadBackup) atau format state langsung
  const data = parsed.data || parsed;

  if (!data || typeof data !== 'object') {
    return { valid: false, pesanError: 'Struktur data cadangan tidak valid.' };
  }

  if (!Array.isArray(data.kandidat)) {
    return { valid: false, pesanError: 'Data kandidat tidak ditemukan atau tidak berformat array.' };
  }

  // Validasi setiap kandidat di dalam daftar
  const kandidatTervalidasi = [];
  for (let i = 0; i < data.kandidat.length; i++) {
    const k = data.kandidat[i];
    const hasil = validasiKandidat(k);
    if (!hasil.valid) {
      return { valid: false, pesanError: `Kandidat pada baris ke-${i + 1} tidak valid: ${hasil.pesanError}` };
    }
    kandidatTervalidasi.push({
      ...hasil.data,
      id: k.id || hasil.data.id,
      suara: typeof k.suara === 'number' && k.suara >= 0 ? k.suara : 0
    });
  }

  const stateBaru = {
    judulPemilihan: data.judulPemilihan || 'Pemilihan Ketua & Wakil Ketua OSIS',
    namaSekolah: data.namaSekolah || 'SMPN 3 Cibungbulang',
    tahunPeriode: data.tahunPeriode || '2026/2027',
    kandidat: kandidatTervalidasi,
    suaraTidakSah: typeof data.suaraTidakSah === 'number' && data.suaraTidakSah >= 0 ? data.suaraTidakSah : 0,
    riwayatUndo: Array.isArray(data.riwayatUndo) ? data.riwayatUndo : []
  };

  return {
    valid: true,
    stateBaru
  };
}
