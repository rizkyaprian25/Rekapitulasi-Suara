/**
 * Modul Umpan Balik Audio & Getar (Web Audio API & Navigator Vibration)
 * Menghasilkan bunyi klik sintetis yang menyenangkan tanpa file audio eksternal.
 */

class AudioFeedbackController {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;

    // Memuat preferensi mute dari localStorage
    try {
      this.isMuted = localStorage.getItem('rekapitulasi_suara_mute') === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  // Inisialisasi AudioContext secara lazily saat interaksi pengguna pertama
  inisialisasiContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Nada sukses / penambahan suara (+1 Suara)
  bunyikanTambahSuara() {
    if (this.isMuted) return;
    this.inisialisasiContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Nada lonceng ramah: 520Hz meluncur ke 780Hz
      osc.frequency.setValueAtTime(520, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);

      // Umpan balik getar pada smartphone/tablet panitia
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch (e) {
      // Abaikan jika browser membatasi audio
    }
  }

  // Nada pembatalan / Undo suara
  bunyikanUndo() {
    if (this.isMuted) return;
    this.inisialisasiContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      // Nada menurun: 440Hz turun ke 330Hz
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 30, 20]);
      }
    } catch (e) {
      // Abaikan jika browser membatasi audio
    }
  }

  // Toggle status bisu suara
  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('rekapitulasi_suara_mute', this.isMuted ? 'true' : 'false');
    } catch (e) {}
    return this.isMuted;
  }
}

export const audioFeedback = new AudioFeedbackController();
