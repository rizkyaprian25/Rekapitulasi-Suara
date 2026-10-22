/**
 * Modul Penyimpanan Lokal (LocalStorage SSOT Persistence)
 * Menyimpan data pemilihan secara otomatis ke browser storage agar aman dari refresh.
 */

import { DATA_AWAL_PEMILIHAN } from '../contracts/electionContract.js';

const KUNCI_STORAGE = 'rekapitulasi_suara_osis_v1';

/**
 * Memuat state pemilihan dari LocalStorage dengan fallback data awal
 * @returns {Object} State pemilihan
 */
export function muatStatePemilihan() {
  try {
    const rawData = localStorage.getItem(KUNCI_STORAGE);
    if (!rawData) {
      return structuredClone(DATA_AWAL_PEMILIHAN);
    }
    const parsed = JSON.parse(rawData);

    // Verifikasi kelengkapan struktur dasar
    if (!Array.isArray(parsed.kandidat)) {
      return structuredClone(DATA_AWAL_PEMILIHAN);
    }

    // Migrasi otomatis nama sekolah jika masih menggunakan placeholder lama
    const namaSekolahAktual = (!parsed.namaSekolah || parsed.namaSekolah === 'SMA / SMK Negeri Indonesia')
      ? DATA_AWAL_PEMILIHAN.namaSekolah
      : parsed.namaSekolah;

    return {
      judulPemilihan: parsed.judulPemilihan || DATA_AWAL_PEMILIHAN.judulPemilihan,
      namaSekolah: namaSekolahAktual,
      tahunPeriode: parsed.tahunPeriode || DATA_AWAL_PEMILIHAN.tahunPeriode,
      kandidat: parsed.kandidat,
      suaraTidakSah: typeof parsed.suaraTidakSah === 'number' ? parsed.suaraTidakSah : 0,
      riwayatUndo: Array.isArray(parsed.riwayatUndo) ? parsed.riwayatUndo : []
    };
  } catch (error) {
    console.warn('Gagal membaca LocalStorage, memulihkan ke data awal:', error);
    return structuredClone(DATA_AWAL_PEMILIHAN);
  }
}

/**
 * Menyimpan state terkini ke LocalStorage
 * @param {Object} state - State pemilihan terbaru
 * @returns {boolean} Berhasil atau gagal
 */
export function simpanStatePemilihan(state) {
  try {
    localStorage.setItem(KUNCI_STORAGE, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Gagal menulis data ke LocalStorage:', error);
    return false;
  }
}

/**
 * Menyetel ulang seluruh data perolehan suara (Reset ke nol)
 * @param {Object} state - State saat ini
 * @returns {Object} State bersih dengan suara nol
 */
export function resetSuara(state) {
  const stateBaru = {
    ...state,
    kandidat: state.kandidat.map(k => ({ ...k, suara: 0 })),
    suaraTidakSah: 0,
    riwayatUndo: []
  };
  simpanStatePemilihan(stateBaru);
  return stateBaru;
}

/**
 * Reset total ke data bawaan pabrik (Factory Reset)
 * @returns {Object} State bawaan awal
 */
export function resetKeDataAwal() {
  const stateAwal = structuredClone(DATA_AWAL_PEMILIHAN);
  simpanStatePemilihan(stateAwal);
  return stateAwal;
}
