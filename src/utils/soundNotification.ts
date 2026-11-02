/**
 * School Chime Audio Synthesizer using Web Audio API
 * Generates an elegant, crystal-clear 3-tone chime for school announcements
 * (Works 100% offline, zero external asset dependencies)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a warm, polite school bell / announcement chime (E5 -> G5 -> C6)
 */
export function playSchoolChimeSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chimeTones = [
      { freq: 659.25, time: now },         // E5
      { freq: 783.99, time: now + 0.18 },   // G5
      { freq: 1046.50, time: now + 0.36 },  // C6
    ];

    chimeTones.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Smooth attack & gentle exponential decay
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.85);
    });
  } catch (err) {
    console.warn('Audio chime notification could not play:', err);
  }
}
