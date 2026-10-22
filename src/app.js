/**
 * Modul Utama Aplikasi (Root App Shell & State Orchestration)
 * Menghubungkan antarmuka pengguna (UI), state penyimpanan, kalkulasi suara, dan audio.
 */

import { TEMA_WARNA_KANDIDAT, validasiKandidat } from './contracts/electionContract.js';
import { muatStatePemilihan, simpanStatePemilihan, resetSuara } from './core/storage.js';
import { audioFeedback } from './core/audioFeedback.js';
import {
  hitungStatistik,
  tambahSuaraKandidat,
  tambahSuaraTidakSah,
  batalkanSuaraTerakhir,
  tambahKandidatKeState,
  hapusKandidatDariState
} from './features/tally/tallyEngine.js';

// State global aplikasi di memori
let appState = muatStatePemilihan();

// Elemen DOM utama
const candidateGrid = document.getElementById('candidate-grid');
const statTotalMasuk = document.getElementById('stat-total-masuk');
const statSuaraSah = document.getElementById('stat-suara-sah');
const statPersenSah = document.getElementById('stat-persen-sah');
const statSuaraRusak = document.getElementById('stat-suara-rusak');
const statPersenRusak = document.getElementById('stat-persen-rusak');
const undoBar = document.getElementById('undo-bar');
const undoText = document.getElementById('undo-text');
const btnUndo = document.getElementById('btn-undo');

// Modal Elements
const modalTambah = document.getElementById('modal-tambah-kandidat');
const formTambah = document.getElementById('form-tambah-kandidat');
const btnBukaModalTambah = document.getElementById('btn-modal-tambah');
const btnTutupModal = document.getElementById('btn-tutup-modal');
const btnBatalKandidat = document.getElementById('btn-batal-kandidat');
const colorContainer = document.getElementById('color-options-container');
const inputWarnaTema = document.getElementById('input-warna-tema');
const formErrorMsg = document.getElementById('form-error-msg');

const modalReset = document.getElementById('modal-konfirmasi-reset');
const btnResetModal = document.getElementById('btn-reset-modal');
const btnTutupReset = document.getElementById('btn-tutup-reset');
const btnBatalReset = document.getElementById('btn-batal-reset');
const btnEksekusiReset = document.getElementById('btn-eksekusi-reset');

const btnToggleSound = document.getElementById('btn-toggle-sound');
const soundIcon = document.getElementById('sound-icon');
const soundLabel = document.getElementById('sound-label');
const btnCetakLaporan = document.getElementById('btn-cetak-laporan');
const btnTambahTidakSah = document.getElementById('btn-tambah-tidak-sah');

let undoTimeoutId = null;

/**
 * Inisialisasi awal saat dokumen dimuat
 */
function inisialisasiAplikasi() {
  // Sinkronkan nama sekolah dan tahun periode ke antarmuka
  const subtitleEl = document.getElementById('header-subtitle');
  if (subtitleEl && appState.namaSekolah) {
    subtitleEl.textContent = `${appState.namaSekolah} — Periode ${appState.tahunPeriode || '2026/2027'}`;
  }
  const printSchoolEl = document.getElementById('print-school-name');
  if (printSchoolEl && appState.namaSekolah) {
    printSchoolEl.textContent = appState.namaSekolah.toUpperCase();
  }

  siapkanPilihanWarna();
  pasangEventListeners();
  perbaruiTampilanAudio();
  renderSemua();
}

/**
 * Merender seluruh antarmuka (kartu kandidat, statistik, dan berita acara)
 * @param {string | null} kandidatIdAnimasi - ID kandidat yang angkanya perlu dianimasikan
 */
function renderSemua(kandidatIdAnimasi = null) {
  const statistik = hitungStatistik(appState);

  // 1. Render statistik utama
  statTotalMasuk.textContent = statistik.totalSuaraMasuk.toLocaleString('id-ID');
  statSuaraSah.textContent = statistik.suaraSah.toLocaleString('id-ID');
  statPersenSah.textContent = `${statistik.persenSuaraSah}% dari total suara masuk`;
  statSuaraRusak.textContent = statistik.suaraTidakSah.toLocaleString('id-ID');
  statPersenRusak.textContent = `${statistik.persenSuaraTidakSah}% dari total suara masuk`;

  // 2. Render kartu kandidat
  renderKartuKandidat(statistik.kandidat, kandidatIdAnimasi);

  // 3. Render bilah undo
  renderUndoBar();
}

/**
 * Merender daftar kartu kandidat ke dalam grid
 * @param {Array} daftarKandidat - Data kandidat lengkap dengan persentase
 * @param {string | null} kandidatIdAnimasi - ID untuk memicu animasi bump
 */
function renderKartuKandidat(daftarKandidat, kandidatIdAnimasi) {
  candidateGrid.innerHTML = '';

  if (daftarKandidat.length === 0) {
    candidateGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.125rem; font-weight: 700; color: var(--text-secondary);">Belum ada kandidat terdaftar</p>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">Klik tombol "Tambah Kandidat" di atas untuk menambahkan pasangan calon OSIS.</p>
      </div>
    `;
    return;
  }

  daftarKandidat.forEach((kandidat, index) => {
    const kartu = document.createElement('article');
    kartu.className = `candidate-card ${kandidat.isLeading ? 'is-leading' : ''}`;
    kartu.dataset.id = kandidat.id;

    // Hint tombol keyboard shortcut (misal: tombol '1' untuk Paslon 1)
    const shortcutKey = index < 9 ? (index + 1) : null;
    const shortcutBadge = shortcutKey ? `<span class="tally-shortcut-hint">[Tekan ${shortcutKey}]</span>` : '';

    const namaWakilHtml = kandidat.namaWakil 
      ? `<span>& ${escapeHtml(kandidat.namaWakil)}</span>`
      : '';

    const kelasKetuaHtml = kandidat.kelasKetua ? `${escapeHtml(kandidat.kelasKetua)}` : '';
    const kelasWakilHtml = kandidat.kelasWakil ? ` • ${escapeHtml(kandidat.kelasWakil)}` : '';
    const badgeKelas = (kandidat.kelasKetua || kandidat.kelasWakil)
      ? `<span class="candidate-meta-class">${kelasKetuaHtml}${kelasWakilHtml}</span>`
      : '';

    const isAnimasi = kandidatIdAnimasi === kandidat.id;

    kartu.innerHTML = `
      ${kandidat.isLeading ? '<div class="leader-badge">⭐ Unggul Sementara</div>' : ''}
      
      <div class="candidate-header">
        <div class="candidate-badge-num" style="background-color: ${kandidat.warnaTema};">
          <span class="num-label">No.</span>
          <span class="num-val">${kandidat.nomorUrut}</span>
        </div>
        <div class="candidate-names">
          <h3 class="candidate-paslon-title">${escapeHtml(kandidat.namaKetua)}</h3>
          <div class="candidate-sub-names">${namaWakilHtml}</div>
          ${badgeKelas}
        </div>
      </div>

      <div class="candidate-visi" title="${escapeHtml(kandidat.visi)}">
        "${escapeHtml(kandidat.visi)}"
      </div>

      <div class="vote-display-box">
        <div class="vote-number-wrapper">
          <span class="vote-big-number tabular-nums ${isAnimasi ? 'bump-animation' : ''}">${kandidat.suara.toLocaleString('id-ID')}</span>
          <span class="vote-unit">suara</span>
        </div>
        <div class="vote-percentage-badge tabular-nums" style="color: ${kandidat.warnaTema};">
          ${kandidat.persenSuaraSah}%
        </div>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width: ${kandidat.persenSuaraSah}%; background-color: ${kandidat.warnaTema};"></div>
      </div>

      <div class="candidate-actions">
        <button class="btn-tally-big btn-tambah-suara" data-id="${kandidat.id}" style="background-color: ${kandidat.warnaTema};">
          <span>+1 SUARA</span>
          ${shortcutBadge}
        </button>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-quick-add" data-id="${kandidat.id}" data-delta="5" style="flex: 1; font-size: 0.75rem; padding: 0.4rem;">
            +5 Suara
          </button>
          <button class="btn btn-secondary btn-quick-add" data-id="${kandidat.id}" data-delta="10" style="flex: 1; font-size: 0.75rem; padding: 0.4rem;">
            +10 Suara
          </button>
        </div>

        <div class="candidate-card-footer">
          <span style="font-size: 0.75rem; color: var(--text-muted);">
            ${kandidat.persenTotal}% dari seluruh suara
          </span>
          <button class="btn-subtle-delete btn-hapus-kandidat" data-id="${kandidat.id}" data-nama="${escapeHtml(kandidat.namaKetua)}" title="Hapus kandidat ini">
            Hapus
          </button>
        </div>
      </div>
    `;

    candidateGrid.appendChild(kartu);
  });
}

/**
 * Menangani penambahan suara kandidat secara reaktif
 * @param {string} kandidatId - ID kandidat yang ditambah
 * @param {number} delta - Jumlah suara (default 1)
 */
function handleTambahSuara(kandidatId, delta = 1) {
  const { stateBaru, kandidatTarget } = tambahSuaraKandidat(appState, kandidatId, delta);
  if (!kandidatTarget) return;

  appState = stateBaru;
  simpanStatePemilihan(appState);
  audioFeedback.bunyikanTambahSuara();
  renderSemua(kandidatId);

  // Tampilkan notifikasi bilah undo
  tampilkanUndoBar(`+${delta} suara untuk Paslon ${kandidatTarget.nomorUrut} (${kandidatTarget.namaKetua})`);
}

/**
 * Menangani penambahan suara tidak sah
 */
function handleTambahTidakSah() {
  appState = tambahSuaraTidakSah(appState);
  simpanStatePemilihan(appState);
  audioFeedback.bunyikanTambahSuara();
  renderSemua();
  tampilkanUndoBar('1 suara tidak sah / rusak ditambahkan');
}

/**
 * Menangani pembatalan aksi penambahan suara terakhir (Undo)
 */
function handleUndo() {
  const { stateBaru, aksiDibatalkan } = batalkanSuaraTerakhir(appState);
  if (!aksiDibatalkan) return;

  appState = stateBaru;
  simpanStatePemilihan(appState);
  audioFeedback.bunyikanUndo();
  renderSemua();

  sembunyikanUndoBar();
}

/**
 * Menampilkan bilah mengambang tombol Undo
 * @param {string} pesan - Informasi penambahan suara
 */
function tampilkanUndoBar(pesan) {
  undoText.textContent = pesan;
  undoBar.style.display = 'flex';

  if (undoTimeoutId) clearTimeout(undoTimeoutId);
  undoTimeoutId = setTimeout(() => {
    sembunyikanUndoBar();
  }, 10000); // Bertahan 10 detik atau hingga aksi berikutnya
}

function sembunyikanUndoBar() {
  undoBar.style.display = 'none';
  if (undoTimeoutId) clearTimeout(undoTimeoutId);
}

function renderUndoBar() {
  if (appState.riwayatUndo && appState.riwayatUndo.length > 0) {
    const aksiTerakhir = appState.riwayatUndo[0];
    const namaAksi = aksiTerakhir.tipe === 'KANDIDAT' 
      ? `Paslon ${aksiTerakhir.nomorUrut} (${aksiTerakhir.nama}) +${aksiTerakhir.delta}` 
      : `Suara Tidak Sah +${aksiTerakhir.delta}`;
    undoText.textContent = `Aksi terakhir: ${namaAksi}`;
    undoBar.style.display = 'flex';
  } else {
    undoBar.style.display = 'none';
  }
}

/**
 * Mempersiapkan pilihan warna untuk modal tambah kandidat
 */
function siapkanPilihanWarna() {
  colorContainer.innerHTML = '';
  TEMA_WARNA_KANDIDAT.forEach((warna, i) => {
    const bulatan = document.createElement('div');
    bulatan.className = `color-option ${i === 0 ? 'is-selected' : ''}`;
    bulatan.style.backgroundColor = warna.hex;
    bulatan.dataset.color = warna.hex;
    bulatan.title = warna.label;

    bulatan.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(el => el.classList.remove('is-selected'));
      bulatan.classList.add('is-selected');
      inputWarnaTema.value = warna.hex;
    });

    colorContainer.appendChild(bulatan);
  });
}

/**
 * Memasang seluruh listener interaksi antarmuka
 */
function pasangEventListeners() {
  // Event delegasi pada grid kandidat untuk klik +1 Suara, +5, +10, dan Hapus
  candidateGrid.addEventListener('click', (e) => {
    // Tombol +1 Suara
    const btnTally = e.target.closest('.btn-tambah-suara');
    if (btnTally) {
      const kandidatId = btnTally.dataset.id;
      handleTambahSuara(kandidatId, 1);
      return;
    }

    // Tombol +5 atau +10 Suara Cepat
    const btnQuick = e.target.closest('.btn-quick-add');
    if (btnQuick) {
      const kandidatId = btnQuick.dataset.id;
      const delta = parseInt(btnQuick.dataset.delta, 10) || 1;
      handleTambahSuara(kandidatId, delta);
      return;
    }

    // Tombol Hapus Kandidat
    const btnHapus = e.target.closest('.btn-hapus-kandidat');
    if (btnHapus) {
      const kandidatId = btnHapus.dataset.id;
      const nama = btnHapus.dataset.nama;
      if (confirm(`Apakah Anda yakin ingin menghapus kandidat "${nama}" dari daftar pemilihan?`)) {
        appState = hapusKandidatDariState(appState, kandidatId);
        simpanStatePemilihan(appState);
        renderSemua();
      }
      return;
    }
  });

  // Tombol tambah suara tidak sah
  btnTambahTidakSah.addEventListener('click', () => {
    handleTambahTidakSah();
  });

  // Tombol Undo
  btnUndo.addEventListener('click', () => {
    handleUndo();
  });

  // Toggle Audio Bisu / Aktif
  btnToggleSound.addEventListener('click', () => {
    const isMuted = audioFeedback.toggleMute();
    perbaruiTampilanAudio();
  });

  // Modal Tambah Kandidat
  btnBukaModalTambah.addEventListener('click', () => {
    // Tentukan nomor urut berikutnya secara otomatis
    const maxNomor = appState.kandidat.reduce((max, k) => Math.max(max, k.nomorUrut || 0), 0);
    document.getElementById('input-nomor-urut').value = maxNomor + 1;
    formErrorMsg.style.display = 'none';
    modalTambah.classList.add('is-open');
    modalTambah.setAttribute('aria-hidden', 'false');
    document.getElementById('input-nama-ketua').focus();
  });

  const tutupModalTambah = () => {
    modalTambah.classList.remove('is-open');
    modalTambah.setAttribute('aria-hidden', 'true');
    formTambah.reset();
  };

  btnTutupModal.addEventListener('click', tutupModalTambah);
  btnBatalKandidat.addEventListener('click', tutupModalTambah);

  // Submit Form Tambah Kandidat
  formTambah.addEventListener('submit', (e) => {
    e.preventDefault();

    const dataInput = {
      nomorUrut: document.getElementById('input-nomor-urut').value,
      namaKetua: document.getElementById('input-nama-ketua').value,
      namaWakil: document.getElementById('input-nama-wakil').value,
      kelasKetua: document.getElementById('input-kelas-ketua').value,
      kelasWakil: document.getElementById('input-kelas-wakil').value,
      visi: document.getElementById('input-visi').value,
      warnaTema: inputWarnaTema.value
    };

    const hasilValidasi = validasiKandidat(dataInput);
    if (!hasilValidasi.valid) {
      formErrorMsg.textContent = hasilValidasi.pesanError;
      formErrorMsg.style.display = 'block';
      return;
    }

    // Periksa apakah nomor urut sudah dipakai
    const nomorSudahAda = appState.kandidat.some(k => k.nomorUrut === hasilValidasi.data.nomorUrut);
    if (nomorSudahAda) {
      formErrorMsg.textContent = `Nomor urut ${hasilValidasi.data.nomorUrut} sudah digunakan oleh pasangan calon lain.`;
      formErrorMsg.style.display = 'block';
      return;
    }

    appState = tambahKandidatKeState(appState, hasilValidasi.data);
    simpanStatePemilihan(appState);
    tutupModalTambah();
    renderSemua();
  });

  // Modal Reset Suara
  btnResetModal.addEventListener('click', () => {
    modalReset.classList.add('is-open');
    modalReset.setAttribute('aria-hidden', 'false');
  });

  const tutupModalReset = () => {
    modalReset.classList.remove('is-open');
    modalReset.setAttribute('aria-hidden', 'true');
  };

  btnTutupReset.addEventListener('click', tutupModalReset);
  btnBatalReset.addEventListener('click', tutupModalReset);

  btnEksekusiReset.addEventListener('click', () => {
    appState = resetSuara(appState);
    tutupModalReset();
    renderSemua();
  });

  // Cetak Berita Acara
  btnCetakLaporan.addEventListener('click', () => {
    siapkanDataCetak();
    window.print();
  });

  // Keyboard Shortcuts Cepat untuk Operator Hitung
  window.addEventListener('keydown', (e) => {
    // Jangan picu jika sedang mengetik di input form atau textarea
    const tagAktif = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tagAktif === 'input' || tagAktif === 'textarea') return;

    // Tombol angka 1 s.d. 9 untuk tambah suara kandidat sesuai indeks
    const angka = parseInt(e.key, 10);
    if (!isNaN(angka) && angka >= 1 && angka <= 9) {
      const targetIndex = angka - 1;
      if (appState.kandidat[targetIndex]) {
        e.preventDefault();
        handleTambahSuara(appState.kandidat[targetIndex].id, 1);
      }
      return;
    }

    // Shortcut 'u' atau 'Ctrl+Z' untuk Undo
    if (e.key.toLowerCase() === 'u' || (e.ctrlKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      handleUndo();
    }
  });
}

/**
 * Mempersiapkan data untuk tabel Berita Acara Cetak
 */
function siapkanDataCetak() {
  const statistik = hitungStatistik(appState);
  const printTableBody = document.getElementById('print-table-body');
  const printDate = document.getElementById('print-date');
  
  const sekarang = new Date();
  const formatTanggal = sekarang.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  printDate.textContent = `Hari / Tanggal: ${formatTanggal} | Pukul: ${sekarang.toLocaleTimeString('id-ID')} WIB`;

  printTableBody.innerHTML = '';
  statistik.kandidat.forEach(k => {
    const tr = document.createElement('tr');
    const namaLengkap = k.namaWakil 
      ? `${k.namaKetua} & ${k.namaWakil}` 
      : k.namaKetua;

    tr.innerHTML = `
      <td style="text-align: center; font-weight: bold;">${k.nomorUrut}</td>
      <td>
        <strong>${escapeHtml(namaLengkap)}</strong>
        <br><small style="color: #555;">${k.kelasKetua || ''} ${k.kelasWakil ? '& ' + k.kelasWakil : ''}</small>
      </td>
      <td style="text-align: right; font-weight: bold;">${k.suara.toLocaleString('id-ID')} suara</td>
      <td style="text-align: right; font-weight: bold;">${k.persenSuaraSah}%</td>
    `;
    printTableBody.appendChild(tr);
  });

  document.getElementById('print-total-sah').textContent = `${statistik.suaraSah.toLocaleString('id-ID')} suara`;
  document.getElementById('print-persen-sah').textContent = `${statistik.persenSuaraSah}%`;
  document.getElementById('print-total-rusak').textContent = `${statistik.suaraTidakSah.toLocaleString('id-ID')} suara`;
  document.getElementById('print-persen-rusak').textContent = `${statistik.persenSuaraTidakSah}%`;
  document.getElementById('print-total-semua').textContent = `${statistik.totalSuaraMasuk.toLocaleString('id-ID')} suara`;
}

/**
 * Memperbarui tampilan tombol audio
 */
function perbaruiTampilanAudio() {
  if (audioFeedback.isMuted) {
    soundIcon.textContent = '🔇';
    soundLabel.textContent = 'Suara Bisu';
  } else {
    soundIcon.textContent = '🔊';
    soundLabel.textContent = 'Suara Aktif';
  }
}

/**
 * Sanitasi HTML sederhana untuk mencegah XSS pada teks kandidat
 * @param {string} str - Teks mentah
 * @returns {string} Teks aman
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Jalankan inisialisasi saat DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inisialisasiAplikasi);
} else {
  inisialisasiAplikasi();
}
