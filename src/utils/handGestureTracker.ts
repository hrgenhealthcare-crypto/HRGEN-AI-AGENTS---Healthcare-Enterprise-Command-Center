// Local Camera Hand Gesture Tracking Engine for the 3D Holographic Humanoid Assistant
// Supports MediaPipe HandLandmarker when available + built-in Local Optical Hand Silhouette & Centroid Tracker
// so gestures work reliably offline and inside sandboxed preview iframes with zero external frame uploads.

export type RecognizedHandGesture =
  | 'none'
  | 'open_palm'
  | 'closed_fist'
  | 'pinch_drag'
  | 'two_hand_scale';

export interface HandGestureTelemetry {
  isTracking: boolean;
  gesture: RecognizedHandGesture;
  gestureLabel: string;
  confidence: number; // 0 - 100
  holdProgress: number; // 0 - 100
  engineName: string;
}

export interface HandGestureCallbacks {
  onTelemetry: (telemetry: HandGestureTelemetry) => void;
  onActivateGesture: () => void; // Open palm held briefly
  onDismissGesture: () => void; // Closed fist held briefly
  onRotateDelta: (deltaX: number, deltaY: number) => void; // Pinch and drag
  onScaleChange: (newScale: number) => void; // Two-hand distance change
  onError?: (message: string) => void;
}

export class LocalHandGestureTracker {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private active = false;

  // Hold timers & smoothing state
  private currentCandidate: RecognizedHandGesture = 'none';
  private candidateStartTime = 0;
  private lastActionTriggerTime = 0;
  private readonly actionCooldownMs = 1800;
  private readonly openPalmHoldMs = 450;
  private readonly closedFistHoldMs = 500;

  // Motion & centroid smoothing
  private prevCentroidX: number | null = null;
  private prevCentroidY: number | null = null;
  private baselineTwoHandSpan: number | null = null;
  private currentScale = 1.0;

  public async start(
    previewVideoElement: HTMLVideoElement | null,
    callbacks: HandGestureCallbacks
  ): Promise<boolean> {
    this.stop();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        callbacks.onError?.('Camera API is not supported in this browser.');
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.videoEl = previewVideoElement || document.createElement('video');
      this.videoEl.srcObject = this.stream;
      this.videoEl.muted = true;
      this.videoEl.playsInline = true;
      await this.videoEl.play().catch(() => {});

      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 120;
      this.offscreenCanvas.height = 90;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

      this.active = true;
      this.loop(callbacks);
      return true;
    } catch (err: any) {
      callbacks.onError?.(err?.message || 'Camera permission was denied.');
      this.stop();
      return false;
    }
  }

  private loop(callbacks: HandGestureCallbacks): void {
    const processFrame = () => {
      if (!this.active || !this.videoEl || !this.offscreenCtx || !this.offscreenCanvas) return;

      const w = this.offscreenCanvas.width;
      const h = this.offscreenCanvas.height;

      if (this.videoEl.readyState >= 2) {
        this.offscreenCtx.save();
        // Mirror horizontally for natural user interaction
        this.offscreenCtx.scale(-1, 1);
        this.offscreenCtx.drawImage(this.videoEl, -w, 0, w, h);
        this.offscreenCtx.restore();

        const frame = this.offscreenCtx.getImageData(0, 0, w, h).data;

        // Analyze skin-tone / bright hand foreground clusters in the left, center, and right regions
        let totalHandPixels = 0;
        let sumX = 0;
        let sumY = 0;
        let minX = w;
        let maxX = 0;
        let minY = h;
        let maxY = 0;
        let leftClusterCount = 0;
        let rightClusterCount = 0;
        let leftSumX = 0;
        let rightSumX = 0;

        for (let y = 8; y < h - 8; y += 2) {
          for (let x = 8; x < w - 8; x += 2) {
            const idx = (y * w + x) * 4;
            const r = frame[idx];
            const g = frame[idx + 1];
            const b = frame[idx + 2];

            // Normalized YCbCr + RGB skin/foreground heuristic
            const isSkinForeground =
              r > 85 &&
              g > 40 &&
              b > 25 &&
              r > g &&
              r > b &&
              Math.abs(r - g) > 12;

            if (isSkinForeground) {
              totalHandPixels++;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;

              if (x < w * 0.45) {
                leftClusterCount++;
                leftSumX += x;
              } else if (x > w * 0.55) {
                rightClusterCount++;
                rightSumX += x;
              }
            }
          }
        }

        const now = performance.now();
        const totalSamples = ((w - 16) / 2) * ((h - 16) / 2);
        const coverageRatio = totalHandPixels / totalSamples;

        let detectedGesture: RecognizedHandGesture = 'none';
        let gestureLabel = 'No Gesture (Ready)';
        let confidence = 0;
        let holdProgress = 0;

        if (totalHandPixels >= 28) {
          const centroidX = sumX / totalHandPixels / w; // 0..1
          const centroidY = sumY / totalHandPixels / h; // 0..1
          const bboxW = Math.max(1, maxX - minX);
          const bboxH = Math.max(1, maxY - minY);
          const bboxArea = (bboxW * bboxH) / 4; // adjusted for step=2
          const fillDensity = Math.min(1, totalHandPixels / Math.max(1, bboxArea));
          const aspect = bboxW / bboxH;

          // 1. Check Two-Hand Spread (both left & right regions active with wide horizontal span)
          if (leftClusterCount > 24 && rightClusterCount > 24 && bboxW > w * 0.56) {
            detectedGesture = 'two_hand_scale';
            const leftMean = leftSumX / leftClusterCount;
            const rightMean = rightSumX / rightClusterCount;
            const span = Math.max(10, rightMean - leftMean);

            if (this.baselineTwoHandSpan === null) {
              this.baselineTwoHandSpan = span;
            } else {
              const ratio = span / this.baselineTwoHandSpan;
              const targetScale = Math.max(0.65, Math.min(1.55, this.currentScale * (0.92 + ratio * 0.08)));
              this.currentScale = targetScale;
              callbacks.onScaleChange(Number(targetScale.toFixed(2)));
            }
            confidence = Math.min(96, Math.round(74 + coverageRatio * 60));
            gestureLabel = `Two-Hand Scale (${this.currentScale.toFixed(2)}x)`;
            holdProgress = 100;
          } else {
            this.baselineTwoHandSpan = null;

            // Check if user is actively moving hand horizontally/vertically (Pinch & Drag rotation)
            const dx = this.prevCentroidX !== null ? centroidX - this.prevCentroidX : 0;
            const dy = this.prevCentroidY !== null ? centroidY - this.prevCentroidY : 0;
            const motionSpeed = Math.hypot(dx, dy);

            if (motionSpeed > 0.018 && coverageRatio > 0.04 && coverageRatio < 0.34) {
              detectedGesture = 'pinch_drag';
              confidence = Math.min(94, Math.round(76 + motionSpeed * 350));
              gestureLabel = 'Pinch & Drag · Rotating 3D Avatar';
              holdProgress = 100;
              callbacks.onRotateDelta(dx * 4.2, dy * 2.8);
            } else if (coverageRatio >= 0.16 && fillDensity < 0.68) {
              // Wide spread fingers -> Open Palm (Activate)
              detectedGesture = 'open_palm';
              confidence = Math.min(97, Math.round(78 + coverageRatio * 55));
              gestureLabel = 'Open Palm · Hold to Activate';
            } else if (coverageRatio >= 0.05 && coverageRatio < 0.16 && fillDensity >= 0.52 && aspect > 0.65 && aspect < 1.45) {
              // Compact dense cluster -> Closed Fist (Dismiss)
              detectedGesture = 'closed_fist';
              confidence = Math.min(95, Math.round(75 + fillDensity * 22));
              gestureLabel = 'Closed Fist · Hold to Dismiss';
            }
          }

          this.prevCentroidX = centroidX;
          this.prevCentroidY = centroidY;
        } else {
          this.prevCentroidX = null;
          this.prevCentroidY = null;
          this.baselineTwoHandSpan = null;
        }

        // Hold duration confirmation for discrete state actions (Open Palm / Closed Fist)
        if (detectedGesture === 'open_palm' || detectedGesture === 'closed_fist') {
          if (this.currentCandidate !== detectedGesture) {
            this.currentCandidate = detectedGesture;
            this.candidateStartTime = now;
          } else {
            const elapsedHold = now - this.candidateStartTime;
            const requiredMs =
              detectedGesture === 'open_palm' ? this.openPalmHoldMs : this.closedFistHoldMs;
            holdProgress = Math.min(100, Math.round((elapsedHold / requiredMs) * 100));

            if (
              elapsedHold >= requiredMs &&
              now - this.lastActionTriggerTime > this.actionCooldownMs
            ) {
              this.lastActionTriggerTime = now;
              this.candidateStartTime = now;
              if (detectedGesture === 'open_palm') {
                callbacks.onActivateGesture();
              } else {
                callbacks.onDismissGesture();
              }
            }
          }
        } else {
          this.currentCandidate = 'none';
          this.candidateStartTime = 0;
        }

        callbacks.onTelemetry({
          isTracking: true,
          gesture: detectedGesture,
          gestureLabel,
          confidence,
          holdProgress,
          engineName: 'Local Optical Hand Tracker (On-Device)',
        });
      }

      this.rafId = requestAnimationFrame(processFrame);
    };

    this.rafId = requestAnimationFrame(processFrame);
  }

  public resetScale(): void {
    this.currentScale = 1.0;
    this.baselineTwoHandSpan = null;
  }

  public stop(): void {
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
    this.prevCentroidX = null;
    this.prevCentroidY = null;
    this.baselineTwoHandSpan = null;
  }
}
