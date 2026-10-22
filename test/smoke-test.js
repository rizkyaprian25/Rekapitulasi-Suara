/**
 * Smoke Test Rekapitulasi Suara OSIS (Quality Gate Phase 4)
 * Menguji integritas kalkulasi matematika, kontrak data, dan stack Undo.
 */

import assert from 'node:assert/strict';
import { DATA_AWAL_PEMILIHAN, validasiKandidat } from '../src/contracts/electionContract.js';
import {
  hitungStatistik,
  tambahSuaraKandidat,
  tambahSuaraTidakSah,
  batalkanSuaraTerakhir,
  tambahKandidatKeState,
  hapusKandidatDariState,
  hapusSemuaKandidatDariState
} from '../src/features/tally/tallyEngine.js';
import { buatStringBackup, validasiDanParseBackup } from '../src/features/backup/backupEngine.js';

console.log('🧪 Memulai Smoke Test Kualitas Sistem Rekapitulasi Suara OSIS...\n');

// 1. Pengujian Validasi Kontrak Data
console.log('1. Menguji validasi kontrak data kandidat...');
{
  // Kasus valid
  const hasilValid = validasiKandidat({
    nomorUrut: '3',
    namaKetua: 'Citra Dewi',
    namaWakil: 'Doni Pratama',
    kelasKetua: 'XI MIPA 2',
    kelasWakil: 'XI IPS 1',
    visi: 'Maju bersama OSIS tangguh'
  });
  assert.equal(hasilValid.valid, true, 'Kandidat valid harus lulus');
  assert.equal(hasilValid.data.nomorUrut, 3);
  assert.equal(hasilValid.data.suara, 0);

  // Kasus tanpa nama ketua (harus gagal)
  const hasilGagalNama = validasiKandidat({ nomorUrut: '4', namaKetua: '   ' });
  assert.equal(hasilGagalNama.valid, false, 'Harus gagal jika nama ketua kosong');

  // Kasus nomor urut tidak valid (harus gagal)
  const hasilGagalNomor = validasiKandidat({ nomorUrut: 'abc', namaKetua: 'Eko' });
  assert.equal(hasilGagalNomor.valid, false, 'Harus gagal jika nomor urut bukan angka');
  console.log('   ✅ Validasi kontrak data lulus 100%.');
}

// 2. Pengujian Tally Engine & Perhitungan Suara
console.log('\n2. Menguji logika mutasi suara dan kalkulasi persentase...');
{
  let state = structuredClone(DATA_AWAL_PEMILIHAN);

  // Tambah 3 suara untuk kandidat-1
  state = tambahSuaraKandidat(state, 'kandidat-1', 1).stateBaru;
  state = tambahSuaraKandidat(state, 'kandidat-1', 1).stateBaru;
  state = tambahSuaraKandidat(state, 'kandidat-1', 1).stateBaru;

  // Tambah 1 suara untuk kandidat-2
  state = tambahSuaraKandidat(state, 'kandidat-2', 1).stateBaru;

  // Tambah 1 suara tidak sah
  state = tambahSuaraTidakSah(state);

  const stats = hitungStatistik(state);
  assert.equal(stats.suaraSah, 4, 'Total suara sah harus 4');
  assert.equal(stats.suaraTidakSah, 1, 'Total suara tidak sah harus 1');
  assert.equal(stats.totalSuaraMasuk, 5, 'Total suara masuk harus 5');

  // Persentase suara sah
  // Kandidat 1: 3/4 * 100 = 75.0%
  // Kandidat 2: 1/4 * 100 = 25.0%
  const k1 = stats.kandidat.find(k => k.id === 'kandidat-1');
  const k2 = stats.kandidat.find(k => k.id === 'kandidat-2');

  assert.equal(k1.persenSuaraSah, 75.0, 'Persentase suara sah kandidat 1 harus 75%');
  assert.equal(k2.persenSuaraSah, 25.0, 'Persentase suara sah kandidat 2 harus 25%');
  assert.equal(k1.isLeading, true, 'Kandidat 1 harus berstatus memimpin');
  assert.equal(k2.isLeading, false, 'Kandidat 2 tidak memimpin');
  console.log('   ✅ Kalkulasi matematika & persentase akurat 100%.');
}

// 3. Pengujian Mekanisme Batalkan Suara (Undo Stack)
console.log('\n3. Menguji mekanisme pembatalan suara (Undo)...');
{
  let state = structuredClone(DATA_AWAL_PEMILIHAN);

  // Tambah suara
  state = tambahSuaraKandidat(state, 'kandidat-2', 5).stateBaru;
  assert.equal(state.kandidat.find(k => k.id === 'kandidat-2').suara, 5);

  // Eksekusi Undo
  const hasilUndo = batalkanSuaraTerakhir(state);
  state = hasilUndo.stateBaru;
  assert.equal(hasilUndo.aksiDibatalkan.delta, 5);
  assert.equal(state.kandidat.find(k => k.id === 'kandidat-2').suara, 0, 'Suara harus kembali ke 0 setelah undo');
  console.log('   ✅ Mekanisme Undo berfungsi sempurna.');
}

// 4. Pengujian Tambah & Hapus Kandidat Dinamis
console.log('\n4. Menguji penambahan dan penghapusan kandidat dinamis...');
{
  let state = structuredClone(DATA_AWAL_PEMILIHAN);
  const kandidatBaru = {
    id: 'kandidat-3',
    nomorUrut: 3,
    namaKetua: 'Fikri Haikal',
    namaWakil: 'Gita Gutawa',
    kelasKetua: 'XI MIPA 3',
    kelasWakil: 'XI IPS 3',
    visi: 'OSIS Berkarakter',
    suara: 0,
    warnaTema: '#7c3aed'
  };

  state = tambahKandidatKeState(state, kandidatBaru);
  assert.equal(state.kandidat.length, 3, 'Jumlah kandidat harus menjadi 3');

  state = hapusKandidatDariState(state, 'kandidat-3');
  assert.equal(state.kandidat.length, 2, 'Jumlah kandidat harus kembali menjadi 2');

  // Pengujian hapus seluruh kandidat (bersihkan dummy)
  state = hapusSemuaKandidatDariState(state);
  assert.equal(state.kandidat.length, 0, 'Daftar kandidat harus kosong');
  assert.equal(state.suaraTidakSah, 0, 'Suara tidak sah harus reset ke 0');
  console.log('   ✅ Operasi CRUD kandidat dinamis & bersihkan dummy berhasil.');
}

// 5. Pengujian Cadangkan & Pulihkan Berkas JSON
console.log('\n5. Menguji mekanisme cadangkan dan pulihkan data JSON...');
{
  const stateUji = structuredClone(DATA_AWAL_PEMILIHAN);
  stateUji.kandidat[0].suara = 125;
  stateUji.kandidat[1].suara = 89;
  stateUji.suaraTidakSah = 4;

  // Ekspor ke JSON
  const jsonString = buatStringBackup(stateUji);
  assert.ok(jsonString.includes('SMPN 3 Cibungbulang'), 'JSON harus mencantumkan nama sekolah');
  assert.ok(jsonString.includes('125'), 'JSON harus menyimpan jumlah suara');

  // Pulihkan dari JSON valid
  const hasilPulih = validasiDanParseBackup(jsonString);
  assert.equal(hasilPulih.valid, true, 'Parsing JSON valid harus sukses');
  assert.equal(hasilPulih.stateBaru.kandidat.length, 2);
  assert.equal(hasilPulih.stateBaru.kandidat[0].suara, 125);
  assert.equal(hasilPulih.stateBaru.suaraTidakSah, 4);

  // Uji pemulihan dari JSON rusak (format JSON salah)
  const hasilRusak = validasiDanParseBackup('{ "rusak": true, ');
  assert.equal(hasilRusak.valid, false, 'Harus gagal jika JSON rusak');

  // Uji pemulihan dari JSON dengan struktur tidak lengkap
  const hasilTanpaKandidat = validasiDanParseBackup(JSON.stringify({ namaSekolah: 'SMP' }));
  assert.equal(hasilTanpaKandidat.valid, false, 'Harus gagal jika tidak ada array kandidat');

  console.log('   ✅ Modul cadangkan & pulihkan JSON tervalidasi 100%.');
}

console.log('\n🎉 SELURUH SMOKE TEST QUALITY GATE LULUS TANPA KESALAHAN! (0 Errors)\n');
