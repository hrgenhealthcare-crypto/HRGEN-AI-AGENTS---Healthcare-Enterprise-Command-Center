// Web Audio procedural sound synthesizer, speech amplitude envelope analyzer,
// and experimental high-frequency acoustic snap detector for the 3D Holographic Humanoid Assistant.

class HologramSoundSystem {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Soft ascending holographic materialization & scanline activation sound
  public playMaterializeSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Primary rising scan sweep
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(240, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 0.42);

      sweepGain.gain.setValueAtTime(0.001, now);
      sweepGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      sweepGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.45);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(now);
      sweepOsc.stop(now + 0.46);

      // Harmonic crystalline shimmer chord
      const chordFreqs = [523.25, 659.25, 987.77]; // C5, E5, B5
      chordFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.08 + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + 0.08 + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.035, now + 0.14 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.55 + idx * 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.08 + idx * 0.05);
        osc.stop(now + 0.58 + idx * 0.05);
      });
    } catch {
      // Ignore audio policy restrictions
    }
  }

  // Subtle confirmation chime when a voice/gesture/text command is accepted
  public playConfirmSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freqs = [587.33, 880]; // D5 -> A5
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.05, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.07 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.24);
      });
    } catch {
      // Ignore
    }
  }

  // Soft descending particle-dissolve sound on dismissal
  public playDismissSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.36);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }
}

export const hologramAudio = new HologramSoundSystem();

/**
 * Speech-Timing & Amplitude Envelope Generator
 * Drives realistic jaw/mouth articulation during actual speech synthesis
 * without claiming phoneme-accurate viseme alignment.
 */
export class SpeechAmplitudeEnvelope {
  private currentAmplitude = 0;
  private wordPulseBoost = 0;
  private rafId: number | null = null;
  private active = false;
  private startTime = 0;

  public startSpeaking(onUpdate: (amplitude: number) => void): void {
    this.stop();
    this.active = true;
    this.startTime = performance.now();

    const tick = (now: number) => {
      if (!this.active) return;
      const elapsed = (now - this.startTime) / 1000;

      // Multi-frequency syllable cadence envelope + boundary word boosts
      const syllableWave =
        0.38 +
        0.28 * Math.sin(elapsed * 14.5) +
        0.18 * Math.cos(elapsed * 23.0) +
        0.14 * Math.sin(elapsed * 7.2);

      // Decay word boundary boost smoothly
      this.wordPulseBoost *= 0.88;

      // Brief natural micro-pauses between phrases
      const phraseGate = Math.sin(elapsed * 2.8) > -0.78 ? 1.0 : 0.18;

      this.currentAmplitude = Math.min(
        1.0,
        Math.max(0.05, (syllableWave + this.wordPulseBoost) * phraseGate)
      );

      onUpdate(this.currentAmplitude);
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  public triggerWordBoundary(): void {
    this.wordPulseBoost = 0.35;
  }

  public stop(onUpdate?: (amplitude: number) => void): void {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.currentAmplitude = 0;
    this.wordPulseBoost = 0;
    if (onUpdate) onUpdate(0);
  }
}

/**
 * Experimental Finger-Snap Acoustic Transient Detector
 * Analyzes high-frequency (>1800Hz) short-duration transients with sensitivity & 2.5s cooldown.
 * Note: Labeled experimental in the UI because sharp claps or desk taps share spectral traits with finger snaps.
 */
export class ExperimentalSnapDetector {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId: number | null = null;
  private sensitivity: number = 0.65; // 0.1 (least sensitive) to 1.0 (most sensitive)
  private cooldownMs: number = 2500;
  private lastTriggerTime: number = 0;
  private rollingEnergy: number = 0.01;
  private spikeStartMs: number = 0;
  private peakDuringSpike: number = 0;

  public async start(
    onSnapDetected: (confidence: number) => void,
    onError?: (errMessage: string) => void
  ): Promise<boolean> {
    this.stop();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.('Microphone API not supported in this browser.');
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.stream);

      // High-pass filter at 1900Hz isolates crisp finger-snap transients from low-frequency speech/hum
      const highpass = this.audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 1900;
      highpass.Q.value = 0.8;

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.15;

      source.connect(highpass);
      highpass.connect(this.analyser);

      const timeData = new Float32Array(this.analyser.fftSize);

      const monitor = () => {
        if (!this.analyser) return;
        this.analyser.getFloatTimeDomainData(timeData);

        let sumSq = 0;
        let peak = 0;
        for (let i = 0; i < timeData.length; i++) {
          const sample = Math.abs(timeData[i]);
          sumSq += sample * sample;
          if (sample > peak) peak = sample;
        }
        const rms = Math.sqrt(sumSq / timeData.length);

        const now = performance.now();
        // Dynamic threshold mapped from sensitivity (0.1 -> high threshold, 1.0 -> lower threshold)
        const minPeakThreshold = Math.max(0.06, 0.36 - this.sensitivity * 0.26);
        const crestRatio = peak / Math.max(0.002, this.rollingEnergy);

        if (peak > minPeakThreshold && crestRatio > 4.2) {
          if (this.spikeStartMs === 0) {
            this.spikeStartMs = now;
            this.peakDuringSpike = peak;
          } else {
            this.peakDuringSpike = Math.max(this.peakDuringSpike, peak);
          }
        } else if (this.spikeStartMs > 0) {
          const durationMs = now - this.spikeStartMs;
          // A finger snap transient decays rapidly (< 85ms), whereas speech syllables sustain longer
          if (
            durationMs >= 4 &&
            durationMs <= 85 &&
            now - this.lastTriggerTime > this.cooldownMs
          ) {
            this.lastTriggerTime = now;
            const confidence = Math.min(98, Math.round(65 + Math.min(1, this.peakDuringSpike * 2) * 30));
            onSnapDetected(confidence);
          }
          this.spikeStartMs = 0;
          this.peakDuringSpike = 0;
        }

        // Smooth ambient rolling energy
        this.rollingEnergy = this.rollingEnergy * 0.92 + rms * 0.08;
        this.rafId = requestAnimationFrame(monitor);
      };

      this.rafId = requestAnimationFrame(monitor);
      return true;
    } catch (err: any) {
      onError?.(err?.message || 'Microphone permission denied for snap detection.');
      this.stop();
      return false;
    }
  }

  public setSensitivity(value: number): void {
    this.sensitivity = Math.max(0.1, Math.min(1.0, value));
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.analyser = null;
  }
}
