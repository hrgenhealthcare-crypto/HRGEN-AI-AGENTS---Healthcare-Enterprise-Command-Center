# Implementation Plan — 3D Holographic Humanoid AI Assistant

## 1. Overview & Architectural Goal
Upgrade the existing **HRGen Agentic AI** workspace with an interactive, production-grade **3D Holographic Humanoid AI Assistant** powered by **Three.js** while preserving all existing tabs (`Dashboard`, `Voice Call`, `Agent Team`, `WhatsApp`, `Leads`, `Analytics`), modals (`Train Agent`, `Bot Console`, `Settings`), and Apple Glassmorphism visual language.

Based on your selections:
1. **Placement & Integration**: Available as a **floating assistant stage** across the workspace, embedded inside the **Executive Dashboard** hero showcase, and integrated directly inside the **Live Voice Call Console**.
2. **Visual Style**: **Full upper-body android** with a recognizable sculpted head, readable visor face (blinking eyes, speech-driven articulated mouth/jaw, temple/ear status lights), neck, cybernetic torso with chest core, articulated upper/lower arms, and articulated hands with finger segments.
3. **Action Scope**: Capable of **navigating workspace tabs**, **launching voice/swarm agents**, and **answering workspace queries** in both **Hindi (`hi-IN`)** and **English (`en-IN` / `en-US`)** via server-side Gemini AI with clearly labeled deterministic fallback when offline.

---

## 2. Visual Design & Three.js Humanoid Rig (`src/components/Humanoid3DCanvas.tsx`)
We will construct a multi-part hierarchical `THREE.Group` rig rendered with hardware/software-adaptive `THREE.WebGLRenderer` and `RoomEnvironment` PBR reflections:
- **Materials & Shaders**:
  - Translucent glass-like outer shell (`THREE.MeshPhysicalMaterial` with transmission/opacity, fresnel rim highlights, cyan `#22d3ee` and violet `#8b5cf6` emissive accents).
  - Internal wireframe lattice and glowing neural core nodes inside the cranium and chest.
  - Vertical holographic scanline sweep plane (`THREE.Mesh` + additive gradient material) and restrained floating particle field (`THREE.Points`) that coalesces during materialization and scatters during dismissal.
- **Articulated Anatomy (`THREE.Group` Hierarchy)**:
  - **Head & Readable Face Group**: Sculpted cranium, face visor plate, left/right emissive eyes (with periodic blink scale animation), articulated lower jaw / mouth light bar driven by real speech timing or Web Audio amplitude, and left/right ear/temple pulse indicators.
  - **Neck & Upper Torso Group**: Cervical struts, collar armor, sculpted chest plates, and central multi-ring chest core.
  - **Articulated Arms & Hands (Left & Right)**: Shoulder joints → upper arms → elbow joints → forearms → wrist joints → palm + 5 articulated multi-segment fingers per hand that gesture naturally while speaking, listening, or greeting.
- **Interactive Camera & Transform**:
  - Supports pinch-and-drag rotation (`rotationY`, `rotationX`), two-hand scale (`0.65x` to `1.55x`), pointer drag fallback, and an instant `Reset View` action.

---

## 3. Six-State Lifecycle & Animation Engine
The humanoid operates as an explicit state machine:
`dormant` → `materializing` → `listening` → `processing` → `speaking` → `dismissing`

1. **`dormant`**: Minimized floating launcher or sleeping hologram emitter; particles gently orbit; camera/mic loops remain idle unless explicitly armed.
2. **`materializing` (~1.1s)**: Rapidly assembles the humanoid from scattered holographic particles while a bright cyan/violet vertical scan plane sweeps from base to crown, accompanied by a soft Web Audio materialization chime.
3. **`listening`**: Natural chest breathing, subtle head micro-movements, periodic eye blinking, and a gentle cyan/violet pulse at the ear/temple indicators while capturing speech or awaiting input.
4. **`processing`**: Restrained orbital light pattern across the visor, temple nodes, and chest core while `/api/jarvis/command` processes the query.
5. **`speaking`**: Mouth/jaw and vocal light bars animate in real time using Web Audio API amplitude analysis (or speech synthesis boundary/envelope timing—explicitly labeled as amplitude/timing-driven rather than phoneme-accurate lip sync), paired with expressive forearm and hand articulation.
6. **`dismissing` (~0.9s)**: Smoothly dissolves the humanoid back into rising cyan/violet particles with a soft dismissal tone after a configurable idle timeout (e.g., 15s / 30s / Never). **Auto-dissolve is strictly paused while the user is speaking, the mic is actively listening, or a task/response is running.**

---

## 4. Voice, Sound & Experimental Snap Activation (`src/utils/hologramAudio.ts`)
- **Explicit Microphone Control**: Dedicated **Enable Microphone / Listen** button using browser `SpeechRecognition` / `webkitSpeechRecognition` with seamless toggle between **Hindi (`hi-IN`)** and **English (`en-IN` / `en-US`)**, plus a reliable **Text Command Input** bar so users can always interact even if speech recognition is unsupported or permission is denied.
- **Procedural Web Audio Synthesizer**:
  - Soft crystalline chimes for **Activation**, **Command Confirmation**, and **Dismissal**, plus a global **Mute / Unmute** toggle.
- **Optional Experimental Snap-Sound Activation**:
  - Clearly labeled **Experimental Snap Activation** toggle with a **Sensitivity Slider** (`Low` to `High`) and a **2.5-second cooldown** to prevent false repeats.
  - Uses a Web Audio `AnalyserNode` high-frequency transient detector (measuring sharp high-band energy spikes vs. rolling ambient floor) and transparently notes that loud claps or sharp transients may also trigger it.

---

## 5. Camera-Based Hand Gesture Tracking (`src/utils/handGestureTracker.ts`)
- **MediaPipe Hand Landmarker Integration**:
  - Uses `@mediapipe/tasks-vision` (`HandLandmarker` running locally on browser frames; zero video recording or external frame uploads).
  - Activated only after clicking **Enable Camera Gestures**, with an instant **Camera Off** button and a live mini status badge showing **Tracking Status**, **Confidence %**, **Hold Progress Ring**, and **Recognized Gesture**.
- **Supported Gestures & Equivalent UI Buttons**:
  - **Open Palm (held for 450ms)** → `Activate` humanoid (when dormant).
  - **Closed Fist (held for 500ms)** → `Dismiss` humanoid.
  - **Single-Hand Pinch & Drag** → Smoothly rotate the 3D humanoid left/right/up/down.
  - **Two-Hand Distance Pinch/Spread** → Scale the humanoid within sensible bounds (`0.65x`–`1.55x`).
  - Every gesture has a matching 1-click UI button (`Activate`, `Listen`, `Stop Speaking`, `Dismiss`, `Reset View`, `Rotate/Zoom Reset`) for full accessibility without a camera.

---

## 6. Server-Side AI Brain & Honest Capabilities (`server.ts` & `JarvisHologramAvatar.tsx`)
- **New/Enhanced Endpoint (`POST /api/jarvis/command`)**:
  - Keeps `GEMINI_API_KEY` strictly server-side in `server.ts`.
  - Accepts user speech/text and language preference (`hi-IN` or `en-IN`), returning structured JSON:
    - `reply`: Natural spoken response in Hindi or English.
    - `intent`: Optional workspace action (`navigate_tab`, `open_bot_console`, `open_train_modal`, `call_agent`, or `general_answer`) and target tab/agent.
    - `mode`: `'live_gemini'` when `GEMINI_API_KEY` is configured, or `'simulated_fallback'` when running without an active key.
- **Honest Capability Indicator**:
  - Displays a clear, unboxed status indicator in the assistant HUD distinguishing **Live Gemini AI** vs. **Simulated Local Reply**, and **Speech-Amplitude Mouth Sync** so capabilities are 100% transparent.
