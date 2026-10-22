/**
 * Mesin Kalkulasi & Logika Bisnis Rekapitulasi Suara (Tally Engine)
 * Mengelola mutasi suara, persentase otomatis, ranking pemimpin, dan riwayat pembatalan (Undo).
 */

/**
 * Menghitung metrik ringkasan suara saat ini
 * @param {Object} state - State pemilihan
 * @returns {Object} Statistik perolehan suara
 */
export function hitungStatistik(state) {
  const kandidat = state.kandidat || [];
  const suaraSah = kandidat.reduce((total, k) => total + (k.suara || 0), 0);
  const suaraTidakSah = state.suaraTidakSah || 0;
  const totalSuaraMasuk = suaraSah + suaraTidakSah;

  // Cari suara tertinggi untuk status memimpin
  let suaraTertinggi = -1;
  kandidat.forEach(k => {
    if (k.suara > suaraTertinggi) {
      suaraTertinggi = k.suara;
    }
  });

  // Hitung persentase tiap kandidat terhadap total suara sah
  const kandidatDenganPersentase = kandidat.map(k => {
    const persenSuaraSah = suaraSah > 0 ? ((k.suara / suaraSah) * 100) : 0;
    const persenTotal = totalSuaraMasuk > 0 ? ((k.suara / totalSuaraMasuk) * 100) : 0;
    const isLeading = suaraSah > 0 && k.suara === suaraTertinggi && suaraTertinggi > 0;

    return {
      ...k,
      persenSuaraSah: parseFloat(persenSuaraSah.toFixed(1)),
      persenTotal: parseFloat(persenTotal.toFixed(1)),
      isLeading
    };
  });

  return {
    suaraSah,
    suaraTidakSah,
    totalSuaraMasuk,
    persenSuaraSah: totalSuaraMasuk > 0 ? ((suaraSah / totalSuaraMasuk) * 100).toFixed(1) : '0.0',
    persenSuaraTidakSah: totalSuaraMasuk > 0 ? ((suaraTidakSah / totalSuaraMasuk) * 100).toFixed(1) : '0.0',
    kandidat: kandidatDenganPersentase
  };
}

/**
 * Menambahkan suara ke kandidat tertentu
 * @param {Object} state - State pemilihan
 * @param {string} kandidatId - ID kandidat
 * @param {number} delta - Jumlah penambahan suara (default: 1)
 * @returns {{ stateBaru: Object, kandidatTarget: Object | null }}
 */
export function tambahSuaraKandidat(state, kandidatId, delta = 1) {
  let target = null;
  const kandidatBaru = state.kandidat.map(k => {
    if (k.id === kandidatId) {
      target = { ...k, suara: k.suara + delta };
      return target;
    }
    return k;
  });

  if (!target) {
    return { stateBaru: state, kandidatTarget: null };
  }

  // Rekam ke tumpukan riwayat Undo (maksimal 50 riwayat terakhir)
  const logAksi = {
    waktu: new Date().toLocaleTimeString('id-ID'),
    tipe: 'KANDIDAT',
    id: kandidatId,
    nomorUrut: target.nomorUrut,
    nama: target.namaKetua,
    delta: delta
  };

  const riwayatUndoBaru = [logAksi, ...(state.riwayatUndo || [])].slice(0, 50);

  const stateBaru = {
    ...state,
    kandidat: kandidatBaru,
    riwayatUndo: riwayatUndoBaru
  };

  return { stateBaru, kandidatTarget: target };
}

/**
 * Menambahkan suara tidak sah / rusak
 * @param {Object} state - State pemilihan
 * @returns {Object} State baru
 */
export function tambahSuaraTidakSah(state) {
  const logAksi = {
    waktu: new Date().toLocaleTimeString('id-ID'),
    tipe: 'TIDAK_SAH',
    nama: 'Suara Tidak Sah / Rusak',
    delta: 1
  };

  const riwayatUndoBaru = [logAksi, ...(state.riwayatUndo || [])].slice(0, 50);

  return {
    ...state,
    suaraTidakSah: (state.suaraTidakSah || 0) + 1,
    riwayatUndo: riwayatUndoBaru
  };
}

/**
 * Membatalkan aksi penambahan suara terakhir (Undo)
 * @param {Object} state - State pemilihan
 * @returns {{ stateBaru: Object, aksiDibatalkan: Object | null }}
 */
export function batalkanSuaraTerakhir(state) {
  const riwayat = state.riwayatUndo || [];
  if (riwayat.length === 0) {
    return { stateBaru: state, aksiDibatalkan: null };
  }

  const [aksiTerakhir, ...sisaRiwayat] = riwayat;

  if (aksiTerakhir.tipe === 'KANDIDAT') {
    const kandidatBaru = state.kandidat.map(k => {
      if (k.id === aksiTerakhir.id) {
        return {
          ...k,
          suara: Math.max(0, k.suara - aksiTerakhir.delta)
        };
      }
      return k;
    });

    return {
      stateBaru: {
        ...state,
        kandidat: kandidatBaru,
        riwayatUndo: sisaRiwayat
      },
      aksiDibatalkan: aksiTerakhir
    };
  } else if (aksiTerakhir.tipe === 'TIDAK_SAH') {
    return {
      stateBaru: {
        ...state,
        suaraTidakSah: Math.max(0, (state.suaraTidakSah || 0) - aksiTerakhir.delta),
        riwayatUndo: sisaRiwayat
      },
      aksiDibatalkan: aksiTerakhir
    };
  }

  return { stateBaru: state, aksiDibatalkan: null };
}

/**
 * Menambahkan kandidat baru ke dalam daftar
 * @param {Object} state - State pemilihan
 * @param {Object} kandidatBaru - Objek kandidat yang sudah divalidasi
 * @returns {Object} State baru
 */
export function tambahKandidatKeState(state, kandidatBaru) {
  return {
    ...state,
    kandidat: [...state.kandidat, kandidatBaru]
  };
}

/**
 * Menghapus kandidat dari daftar
 * @param {Object} state - State pemilihan
 * @param {string} kandidatId - ID kandidat yang akan dihapus
 * @returns {Object} State baru
 */
export function hapusKandidatDariState(state, kandidatId) {
  return {
    ...state,
    kandidat: state.kandidat.filter(k => k.id !== kandidatId),
    riwayatUndo: (state.riwayatUndo || []).filter(item => item.id !== kandidatId)
  };
}

/**
 * Menghapus seluruh kandidat sekaligus (membersihkan data dummy untuk mulai dari lembar kosong)
 * @param {Object} state - State pemilihan
 * @returns {Object} State baru dengan daftar kandidat kosong
 */
export function hapusSemuaKandidatDariState(state) {
  return {
    ...state,
    kandidat: [],
    suaraTidakSah: 0,
    riwayatUndo: []
  };
}
