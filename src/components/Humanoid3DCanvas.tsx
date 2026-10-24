import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type HumanoidLifecycleState =
  | 'dormant'
  | 'materializing'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'dismissing';

export interface CustomGlbLoadStatus {
  state: 'bundled' | 'loading' | 'loaded' | 'error';
  fileName?: string;
  meshCount?: number;
  errorMessage?: string;
}

interface Humanoid3DCanvasProps {
  lifecycleState: HumanoidLifecycleState;
  speechAmplitude?: number; // 0.0 to 1.0 real-time speech amplitude
  rotationOffset?: { x: number; y: number };
  scaleMultiplier?: number; // 0.65 to 1.55
  customGlbBuffer?: ArrayBuffer | null;
  customGlbFileName?: string;
  onGlbStatusChange?: (status: CustomGlbLoadStatus) => void;
  onPointerRotate?: (deltaX: number, deltaY: number) => void;
  onWheelScale?: (deltaScale: number) => void;
  className?: string;
}

/**
 * 3D Holographic GORT (2008) Half-Body Humanoid AI Assistant
 * - Imposing broad human-proportioned shoulders and pectoral torso
 * - Strong upper arms continuing down to a waist-cropped half-body
 * - Restrained anatomically coherent shapes; smooth continuous satin gunmetal/silver alien metal
 * - Oval helmet head seamlessly emerging from a thick powerful neck (zero nose, lips, ears, cartoon eyes)
 * - ONE narrow horizontal glowing RED visor slit with restrained bloom pulsing with assistant state
 * - Nanite/fine sand particulate assembly on activation & dispersion on dismissal
 * - Driven by THREE.Timer (zero THREE.Clock warnings) and clean callback refs
 */
export const Humanoid3DCanvas: React.FC<Humanoid3DCanvasProps> = ({
  lifecycleState,
  speechAmplitude = 0,
  rotationOffset = { x: 0, y: 0 },
  scaleMultiplier = 1,
  customGlbBuffer = null,
  customGlbFileName,
  onGlbStatusChange,
  onPointerRotate,
  onWheelScale,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<HumanoidLifecycleState>(lifecycleState);
  const speechAmpRef = useRef<number>(speechAmplitude);
  const rotOffsetRef = useRef<{ x: number; y: number }>(rotationOffset);
  const scaleRef = useRef<number>(scaleMultiplier);
  const stateTransitionTimeRef = useRef<number>(performance.now());
  const onPointerRotateRef = useRef(onPointerRotate);
  const onWheelScaleRef = useRef(onWheelScale);
  const onGlbStatusChangeRef = useRef(onGlbStatusChange);

  // References for swapping between bundled GORT procedural half-body and user-supplied local GLB
  const proceduralGroupRef = useRef<THREE.Group | null>(null);
  const customGlbGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    onPointerRotateRef.current = onPointerRotate;
  }, [onPointerRotate]);

  useEffect(() => {
    onWheelScaleRef.current = onWheelScale;
  }, [onWheelScale]);

  useEffect(() => {
    onGlbStatusChangeRef.current = onGlbStatusChange;
  }, [onGlbStatusChange]);

  useEffect(() => {
    if (stateRef.current !== lifecycleState) {
      stateRef.current = lifecycleState;
      stateTransitionTimeRef.current = performance.now();
    }
  }, [lifecycleState]);

  useEffect(() => {
    speechAmpRef.current = speechAmplitude;
  }, [speechAmplitude]);

  useEffect(() => {
    rotOffsetRef.current = rotationOffset;
  }, [rotationOffset]);

  useEffect(() => {
    scaleRef.current = scaleMultiplier;
  }, [scaleMultiplier]);

  // Handle optional user-supplied local GLB ArrayBuffer parsing via GLTFLoader (in-memory only, no upload)
  useEffect(() => {
    const customContainer = customGlbGroupRef.current;
    const proceduralGroup = proceduralGroupRef.current;
    if (!customContainer || !proceduralGroup) return;

    const clearCustomGlb = () => {
      while (customContainer.children.length > 0) {
        const child = customContainer.children[0];
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
        customContainer.remove(child);
      }
    };

    if (!customGlbBuffer) {
      clearCustomGlb();
      customContainer.visible = false;
      proceduralGroup.visible = true;
      onGlbStatusChangeRef.current?.({ state: 'bundled' });
      return;
    }

    onGlbStatusChangeRef.current?.({
      state: 'loading',
      fileName: customGlbFileName,
    });

    const loader = new GLTFLoader();
    try {
      loader.parse(
        customGlbBuffer.slice(0),
        '',
        (gltf) => {
          clearCustomGlb();
          const modelRoot = gltf.scene;
          let meshCount = 0;

          modelRoot.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              meshCount++;
            }
          });

          if (meshCount === 0) {
            customContainer.visible = false;
            proceduralGroup.visible = true;
            onGlbStatusChangeRef.current?.({
              state: 'error',
              fileName: customGlbFileName,
              errorMessage: 'GLB file contained no 3D meshes. Using bundled GORT avatar.',
            });
            return;
          }

          const box = new THREE.Box3().setFromObject(modelRoot);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          const targetHeight = 2.1;
          const normScale = targetHeight / maxDim;

          modelRoot.position.set(
            -center.x * normScale,
            -center.y * normScale - 0.04,
            -center.z * normScale
          );
          modelRoot.scale.setScalar(normScale);

          customContainer.add(modelRoot);
          customContainer.visible = true;
          proceduralGroup.visible = false;

          onGlbStatusChangeRef.current?.({
            state: 'loaded',
            fileName: customGlbFileName,
            meshCount,
          });
        },
        (err) => {
          clearCustomGlb();
          customContainer.visible = false;
          proceduralGroup.visible = true;
          onGlbStatusChangeRef.current?.({
            state: 'error',
            fileName: customGlbFileName,
            errorMessage:
              err instanceof Error
                ? `Invalid GLB format: ${err.message}`
                : 'Failed to parse local GLB file. Using bundled GORT avatar.',
          });
        }
      );
    } catch (err: any) {
      clearCustomGlb();
      customContainer.visible = false;
      proceduralGroup.visible = true;
      onGlbStatusChangeRef.current?.({
        state: 'error',
        fileName: customGlbFileName,
        errorMessage: err?.message || 'Error reading GLB buffer. Using bundled GORT avatar.',
      });
    }
  }, [customGlbBuffer, customGlbFileName]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 300;

    // 1. Scene & Camera: Upper-chest / eye level framing for broad-shouldered GORT
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.04, 3.1);
    camera.lookAt(0, 0.04, 0);

    // 2. High-Performance Anti-Aliased WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Neutral Soft Key and Rim Lighting for Sculptural Satin Silver Alien Metal
    // Key Light (top-front-right neutral white)
    const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.7);
    keyLight.position.set(2.4, 3.2, 3.5);
    scene.add(keyLight);

    // Soft Ambient (keeps satin gunmetal clearly visible against dark backdrop)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.45);
    scene.add(ambientLight);

    // Left Cool Steel Rim Light (carves broad shoulders and helmet silhouette)
    const leftRimLight = new THREE.DirectionalLight(0xe2e8f0, 2.2);
    leftRimLight.position.set(-3.2, 1.8, -2.0);
    scene.add(leftRimLight);

    // Right Cool Steel Rim Light
    const rightRimLight = new THREE.DirectionalLight(0xcfd8dc, 1.8);
    rightRimLight.position.set(3.2, 1.5, -2.2);
    scene.add(rightRimLight);

    // Subtle Chest Fill Light (neutral soft illumination across pectoral plates)
    const chestFillLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    chestFillLight.position.set(0, -1.8, 2.8);
    scene.add(chestFillLight);

    // 4. Materials Setup: Satin Gunmetal/Silver Alien Metal Skin & Single Red Visor
    const allDisposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      allDisposables.push(item);
      return item;
    };

    // Satin gunmetal / silver alien-metal skin (GORT 2008 reference)
    const gortSilverMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xa1a8b5,
        roughness: 0.3,
        metalness: 0.88,
        transparent: true,
        opacity: 1.0,
      })
    );

    // Slightly deeper gunmetal for anatomical recesses & clavicle seams
    const gortTrimMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.36,
        metalness: 0.85,
        transparent: true,
        opacity: 1.0,
      })
    );

    // Dark titanium bezel housing the single visor slit
    const visorBezelMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.42,
        metalness: 0.9,
        transparent: true,
        opacity: 1.0,
      })
    );

    // ONE narrow horizontal glowing RED visor slit
    const visorRedCoreMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xff1e1e,
        transparent: true,
        opacity: 1.0,
      })
    );

    // Restrained red bloom plane pulsing with assistant state
    const visorBloomMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    // 5. Root Hierarchy & GORT Half-Body Geometry Construction
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const proceduralGroup = new THREE.Group();
    proceduralGroupRef.current = proceduralGroup;
    rootGroup.add(proceduralGroup);

    const customGlbGroup = new THREE.Group();
    customGlbGroup.visible = false;
    customGlbGroupRef.current = customGlbGroup;
    rootGroup.add(customGlbGroup);

    const upperBodyGroup = new THREE.Group();
    proceduralGroup.add(upperBodyGroup);

    // --- 5A. GORT HELMET HEAD & THE ONE HORIZONTAL RED VISOR SLIT ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.52, 0.0);
    upperBodyGroup.add(headGroup);

    // Seamless oval helmet dome (high-tessellation sphere sculpted into Gort's cranial profile)
    const helmetGeo = track(new THREE.SphereGeometry(0.36, 64, 64));
    const helmetPos = helmetGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < helmetPos.count; i++) {
      let x = helmetPos.getX(i);
      let y = helmetPos.getY(i);
      let z = helmetPos.getZ(i);

      // Oval elongation
      y *= 1.15;

      // Occipital rear crown extension
      if (z < 0) {
        z *= 1.06;
      }

      // Smooth jaw/mandible taper into the thick neck (zero mouth, nose, ears, or chin cleft)
      if (y < 0) {
        const taper = 1.0 - Math.min(0.28, Math.abs(y) * 0.58);
        x *= taper;
        z *= 0.94 - Math.abs(y) * 0.12;
      }

      // Finite coordinate guarantee
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      if (!Number.isFinite(z)) z = 0;

      helmetPos.setXYZ(i, x, y, z);
    }
    helmetPos.needsUpdate = true;
    helmetGeo.computeVertexNormals();
    helmetGeo.computeBoundingSphere();
    const helmetMesh = new THREE.Mesh(helmetGeo, gortSilverMat);
    headGroup.add(helmetMesh);

    // The ONE narrow horizontal glowing RED visor slit across the face
    // 1. Recessed dark titanium visor bezel
    const visorBezelGeo = track(new THREE.BoxGeometry(0.28, 0.024, 0.035));
    const visorBezelMesh = new THREE.Mesh(visorBezelGeo, visorBezelMat);
    visorBezelMesh.position.set(0, 0.018, 0.348);
    headGroup.add(visorBezelMesh);

    // 2. High-intensity glowing red laser slit
    const visorSlitGeo = track(new THREE.BoxGeometry(0.255, 0.012, 0.02));
    const visorSlitMesh = new THREE.Mesh(visorSlitGeo, visorRedCoreMat);
    visorSlitMesh.position.set(0, 0.018, 0.358);
    headGroup.add(visorSlitMesh);

    // 3. Restrained Red Bloom Quad (pulses with state & speech)
    const visorBloomGeo = track(new THREE.PlaneGeometry(0.38, 0.065));
    const visorBloomMesh = new THREE.Mesh(visorBloomGeo, visorBloomMat);
    visorBloomMesh.position.set(0, 0.018, 0.368);
    headGroup.add(visorBloomMesh);

    // --- 5B. THICK POWERFUL NECK SEAMLESSLY JOINING HEAD AND TORSO ---
    const neckGeo = track(new THREE.CylinderGeometry(0.185, 0.23, 0.28, 48, 16));
    const neckPos = neckGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < neckPos.count; i++) {
      let x = neckPos.getX(i);
      let y = neckPos.getY(i);
      let z = neckPos.getZ(i);

      // Trapezius lateral flare toward the collarbones
      const verticalDown = Math.max(0, Math.min(1.0, (0.14 - y) / 0.28));
      x *= 1.0 + 0.14 * Math.pow(verticalDown, 1.8);
      z *= 1.0 + 0.08 * Math.pow(verticalDown, 1.8);

      // Finite coordinate guarantee
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      if (!Number.isFinite(z)) z = 0;

      neckPos.setXYZ(i, x, y, z);
    }
    neckPos.needsUpdate = true;
    neckGeo.computeVertexNormals();
    neckGeo.computeBoundingSphere();
    const neckMesh = new THREE.Mesh(neckGeo, gortSilverMat);
    neckMesh.position.set(0, 0.16, -0.01);
    upperBodyGroup.add(neckMesh);

    // Subtle dark seam collar at neck base
    const neckSeamGeo = track(new THREE.CylinderGeometry(0.21, 0.22, 0.015, 40));
    const neckSeamMesh = new THREE.Mesh(neckSeamGeo, gortTrimMat);
    neckSeamMesh.position.set(0, 0.04, -0.01);
    upperBodyGroup.add(neckSeamMesh);

    // --- 5C. BROAD HUMAN-PROPORTIONED SHOULDERS & PECTORAL TORSO (HALF-BODY) ---
    // Sculpted Torso: Broad clavicles, defined pectoral plates, and waist-cropped V-taper
    const torsoGeo = track(new THREE.SphereGeometry(0.55, 64, 64));
    const torsoPos = torsoGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < torsoPos.count; i++) {
      let x = torsoPos.getX(i);
      let y = torsoPos.getY(i);
      let z = torsoPos.getZ(i);

      // CRITICAL: Strictly clamp verticalNorm to [0, 1] to prevent floating-point underflow at sphere south pole (-0.55)
      // from producing negative numbers before Math.pow(verticalNorm, 0.68), which caused NaN in Three.js computeBoundingSphere.
      const rawNorm = (y + 0.55) / 1.1;
      const verticalNorm = Math.max(0, Math.min(1.0, Number.isFinite(rawNorm) ? rawNorm : 0));

      // Imposing shoulder breadth at top (~1.44 width), tapering down to ~0.76 at waist crop
      const shoulderSpread = 0.74 + 0.95 * Math.pow(verticalNorm, 0.68);
      x *= shoulderSpread;
      y *= 1.16;

      // Sculpted athletic depth: Flatten anteroposterior thickness so torso is a broad muscular chest rather than a round ball
      const depthSpread = 0.32 + 0.12 * Math.sin(verticalNorm * Math.PI);
      z *= depthSpread;

      // Anatomically coherent pectoral swell (left & right pectoralis major plates)
      if (z > 0 && verticalNorm > 0.36 && verticalNorm < 0.88) {
        const pecDist = Math.abs(x) - 0.23;
        const pecSwell = Math.max(0, 0.052 * (1.0 - pecDist * pecDist * 9.5));
        // Center sternum cleft indentation
        if (Math.abs(x) < 0.06) {
          z -= 0.018;
        }
        z += pecSwell;
      }

      // Back latissimus contouring
      if (z < 0) {
        z *= 0.92;
      }

      // Strict finite guarantee
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      if (!Number.isFinite(z)) z = 0;

      torsoPos.setXYZ(i, x, y, z);
    }
    torsoPos.needsUpdate = true;
    torsoGeo.computeVertexNormals();
    torsoGeo.computeBoundingSphere();
    torsoGeo.computeBoundingBox();
    const torsoMesh = new THREE.Mesh(torsoGeo, gortSilverMat);
    torsoMesh.position.set(0, -0.42, 0);
    upperBodyGroup.add(torsoMesh);

    // Architectural Clavicle Ridge Seam (linking neck base to broad shoulders)
    const clavicleGeo = track(new THREE.CapsuleGeometry(0.016, 0.86, 12, 32));
    clavicleGeo.rotateZ(Math.PI / 2);
    const clavicleMesh = new THREE.Mesh(clavicleGeo, gortTrimMat);
    clavicleMesh.position.set(0, 0.015, 0.215);
    upperBodyGroup.add(clavicleMesh);

    // --- 5D. STRONG UPPER ARMS & DELTOID MUSCLE GROUPS (WAIST-CROPPED HALF-BODY) ---
    const createGortArm = (side: 'left' | 'right') => {
      const sign = side === 'left' ? -1 : 1;
      const armPivot = new THREE.Group();
      armPivot.position.set(sign * 0.64, -0.06, 0);
      upperBodyGroup.add(armPivot);

      // Imposing broad deltoid muscle cap
      const deltoidGeo = track(new THREE.CapsuleGeometry(0.145, 0.32, 24, 32));
      deltoidGeo.scale(0.92, 1.0, 0.85);
      const deltoidMesh = new THREE.Mesh(deltoidGeo, gortSilverMat);
      deltoidMesh.position.set(sign * 0.04, -0.16, 0);
      deltoidMesh.rotation.z = -sign * 0.16;
      deltoidMesh.rotation.x = 0.04;
      armPivot.add(deltoidMesh);

      // Strong upper arm (bicep / tricep column) continuing down to waist-crop level
      const bicepGeo = track(new THREE.CylinderGeometry(0.125, 0.11, 0.38, 28, 12));
      const bicepMesh = new THREE.Mesh(bicepGeo, gortSilverMat);
      bicepMesh.position.set(sign * 0.08, -0.42, 0);
      bicepMesh.rotation.z = -sign * 0.08;
      armPivot.add(bicepMesh);

      // Subtle half-body crop ring at mid-bicep
      const cropRingGeo = track(new THREE.CylinderGeometry(0.114, 0.114, 0.016, 24));
      const cropRingMesh = new THREE.Mesh(cropRingGeo, gortTrimMat);
      cropRingMesh.position.set(sign * 0.08, -0.61, 0);
      armPivot.add(cropRingMesh);

      return armPivot;
    };

    const leftArm = createGortArm('left');
    const rightArm = createGortArm('right');

    // --- 5E. QUIET THIN LASER SCAN-LINE PLANE (ACTIVATION & AMBIENT SWEEP) ---
    const scanLineGeo = track(new THREE.PlaneGeometry(1.85, 0.012));
    const scanLineMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
    scanLineMesh.position.set(0, 0, 0.44);
    rootGroup.add(scanLineMesh);

    // --- 5F. GORT NANITE PARTICULATE ASSEMBLY / DISPERSION FIELD ---
    // Fine metallic sand / nanite swarm that converges into GORT and disperses on dismissal
    const naniteCount = 2400;
    const naniteGeo = track(new THREE.BufferGeometry());
    const currentNanitePos = new Float32Array(naniteCount * 3);
    const targetNanitePos = new Float32Array(naniteCount * 3);
    const dispersedNanitePos = new Float32Array(naniteCount * 3);
    const naniteColors = new Float32Array(naniteCount * 3);

    const cSilver = new THREE.Color(0xe2e8f0);
    const cTungsten = new THREE.Color(0x94a3b8);
    const cGunmetal = new THREE.Color(0xcfd8dc);
    const cRedSpark = new THREE.Color(0xf87171);

    for (let i = 0; i < naniteCount; i++) {
      const u = Math.random();
      let tx = 0;
      let ty = 0;
      let tz = 0;

      if (u < 0.35) {
        // Oval helmet head & visor contour
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.36 + (Math.random() - 0.5) * 0.02;
        tx = r * Math.sin(phi) * Math.cos(theta) * 0.9;
        ty = 0.52 + r * Math.cos(phi) * 1.15;
        tz = r * Math.sin(phi) * Math.sin(theta) * 0.94;
      } else if (u < 0.47) {
        // Thick neck column
        const angle = Math.random() * Math.PI * 2;
        const r = 0.19 + (Math.random() - 0.5) * 0.02;
        tx = Math.cos(angle) * r;
        ty = 0.04 + Math.random() * 0.24;
        tz = Math.sin(angle) * r;
      } else if (u < 0.8) {
        // Broad pectoral chest & waist-cropped torso
        const vNorm = Math.max(0, Math.min(1.0, Math.random()));
        const angle = Math.random() * Math.PI * 2;
        const widthR = (0.36 + 0.38 * Math.pow(vNorm, 0.68)) * (0.94 + Math.random() * 0.12);
        const depthR = 0.26 * (0.88 + Math.random() * 0.18);
        tx = Math.cos(angle) * widthR;
        ty = -0.92 + vNorm * 0.95;
        tz = Math.sin(angle) * depthR;
      } else {
        // Deltoids & upper arms
        const sign = Math.random() > 0.5 ? 1 : -1;
        const armV = Math.random();
        const r = 0.13 + (Math.random() - 0.5) * 0.02;
        const angle = Math.random() * Math.PI * 2;
        tx = sign * 0.68 + Math.cos(angle) * r;
        ty = -0.08 - armV * 0.55;
        tz = Math.sin(angle) * r;
      }

      targetNanitePos[i * 3] = tx;
      targetNanitePos[i * 3 + 1] = ty;
      targetNanitePos[i * 3 + 2] = tz;

      // Dispersed nanite cloud coordinates for movie-accurate assembly & dissolution
      const dAngle = Math.random() * Math.PI * 2;
      const dRadius = 0.95 + Math.random() * 1.55;
      dispersedNanitePos[i * 3] = tx + Math.cos(dAngle) * dRadius;
      dispersedNanitePos[i * 3 + 1] = ty + (Math.random() - 0.35) * 1.45;
      dispersedNanitePos[i * 3 + 2] = tz + Math.sin(dAngle) * dRadius;

      currentNanitePos[i * 3] = tx;
      currentNanitePos[i * 3 + 1] = ty;
      currentNanitePos[i * 3 + 2] = tz;

      const grainColor =
        i % 8 === 0 ? cRedSpark : i % 3 === 0 ? cTungsten : i % 2 === 0 ? cGunmetal : cSilver;
      naniteColors[i * 3] = grainColor.r;
      naniteColors[i * 3 + 1] = grainColor.g;
      naniteColors[i * 3 + 2] = grainColor.b;
    }

    naniteGeo.setAttribute('position', new THREE.BufferAttribute(currentNanitePos, 3));
    naniteGeo.setAttribute('color', new THREE.BufferAttribute(naniteColors, 3));
    naniteGeo.computeBoundingSphere();

    const naniteMat = track(
      new THREE.PointsMaterial({
        size: 0.016,
        vertexColors: true,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const naniteParticles = new THREE.Points(naniteGeo, naniteMat);
    rootGroup.add(naniteParticles);

    // --- 6. ANIMATION LOOP USING THREE.Timer ---
    let rafId: number | null = null;
    const timer = new THREE.Timer();
    timer.connect(document);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed();
      const now = performance.now();
      const currentState = stateRef.current;
      const stateElapsedSec = (now - stateTransitionTimeRef.current) / 1000;
      const speechAmp = speechAmpRef.current;

      // 6.1 Nanite Convergence / Dispersion Calculation (0 = dispersed swarm, 1 = solid Gort)
      let convergence = 1.0;
      if (currentState === 'dormant') {
        convergence = 0.1;
        scanLineMat.opacity = 0.0;
      } else if (currentState === 'materializing') {
        const raw = Math.min(1.0, stateElapsedSec / 1.15);
        convergence = 1.0 - Math.pow(1.0 - raw, 3); // Cubic ease-out assembly
        scanLineMesh.position.y = -1.0 + raw * 1.95;
        scanLineMat.opacity = Math.sin(raw * Math.PI) * 0.65;
      } else if (currentState === 'dismissing') {
        const raw = Math.min(1.0, stateElapsedSec / 0.85);
        convergence = Math.max(0.0, 1.0 - Math.pow(raw, 2)); // Quadratic dispersal
        scanLineMesh.position.y = 0.95 - raw * 1.95;
        scanLineMat.opacity = Math.sin(raw * Math.PI) * 0.45;
      } else {
        convergence = 1.0;
        // Subtle ambient laser sweep every 4.5 seconds
        const scanCycle = (t * 0.28) % 1;
        scanLineMesh.position.y = 0.95 - scanCycle * 1.95;
        scanLineMat.opacity = 0.06 * Math.sin(scanCycle * Math.PI);
      }

      // Smooth solid surface opacity during nanite assembly/dissolution
      const surfaceOpacity = Math.max(0.0, Math.min(1.0, (convergence - 0.12) / 0.88));
      gortSilverMat.opacity = surfaceOpacity;
      gortTrimMat.opacity = surfaceOpacity;
      visorBezelMat.opacity = surfaceOpacity;

      // 6.2 Update Fine Nanite Particle Positions (Swarm dynamics)
      const posAttr = naniteGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const disperseWeight = 1.0 - convergence;

      for (let i = 0; i < naniteCount; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        const driftX = Math.sin(t * 1.2 + i * 0.31) * (0.003 + disperseWeight * 0.045);
        const driftY = Math.cos(t * 1.0 + i * 0.27) * (0.003 + disperseWeight * 0.05);
        const driftZ = Math.sin(t * 0.85 + i * 0.41) * (0.003 + disperseWeight * 0.045);

        posArr[ix] =
          targetNanitePos[ix] * convergence +
          dispersedNanitePos[ix] * disperseWeight +
          driftX;
        posArr[iy] =
          targetNanitePos[iy] * convergence +
          dispersedNanitePos[iy] * disperseWeight +
          driftY;
        posArr[iz] =
          targetNanitePos[iz] * convergence +
          dispersedNanitePos[iz] * disperseWeight +
          driftZ;
      }
      posAttr.needsUpdate = true;
      naniteMat.opacity =
        currentState === 'dormant'
          ? 0.15
          : 0.24 + Math.sin((1.0 - convergence) * Math.PI) * 0.62;

      // 6.3 Natural Imposing Idle Breathing & Micro-Motion
      const breath = Math.sin(t * 1.8);
      upperBodyGroup.position.y = breath * 0.012;
      leftArm.rotation.z = breath * 0.008;
      rightArm.rotation.z = -breath * 0.008;

      // 6.4 State-Driven Pulse & Animation of the ONE RED VISOR SLIT
      if (currentState === 'dormant') {
        visorRedCoreMat.color.setHex(0x600f0f);
        visorRedCoreMat.opacity = 0.25;
        visorBloomMat.opacity = 0.08;
        visorBloomMesh.scale.set(0.9, 0.7, 1);
        headGroup.rotation.set(0, 0, 0);
      } else if (currentState === 'materializing') {
        const ignite = Math.min(1.0, stateElapsedSec / 1.0);
        visorRedCoreMat.color.setHex(0xff1e1e);
        visorRedCoreMat.opacity = ignite;
        visorBloomMat.opacity = ignite * 0.9;
        visorBloomMesh.scale.set(ignite, 0.8 + ignite * 0.2, 1);
      } else if (currentState === 'dismissing') {
        const fade = Math.max(0.0, 1.0 - stateElapsedSec / 0.8);
        visorRedCoreMat.opacity = fade;
        visorBloomMat.opacity = fade * 0.5;
        visorBloomMesh.scale.set(fade, fade, 1);
      } else if (currentState === 'listening') {
        // Attentive, steady crimson visor glow with subtle slow breathing pulse
        const listenPulse = 0.72 + 0.28 * Math.sin(t * 3.2);
        visorRedCoreMat.color.setHex(0xff2222);
        visorRedCoreMat.opacity = 1.0 * surfaceOpacity;
        visorBloomMat.color.setHex(0xef4444);
        visorBloomMat.opacity = listenPulse * 0.88 * surfaceOpacity;
        visorBloomMesh.scale.set(1.02, 1.0 + listenPulse * 0.2, 1);

        headGroup.rotation.y = Math.sin(t * 0.65) * 0.05;
        headGroup.rotation.x = 0.02 + Math.sin(t * 1.1) * 0.015;
        headGroup.rotation.z = 0;
      } else if (currentState === 'processing') {
        // High-energy cycling red beam pulse across the visor
        const procPulse = 0.5 + 0.5 * Math.sin(t * 11.5);
        visorRedCoreMat.color.setHex(procPulse > 0.5 ? 0xff4d4d : 0xef233c);
        visorRedCoreMat.opacity = 1.0 * surfaceOpacity;
        visorBloomMat.color.setHex(0xff3333);
        visorBloomMat.opacity = (0.55 + 0.45 * procPulse) * surfaceOpacity;
        visorBloomMesh.scale.set(1.0 + procPulse * 0.28, 1.0 + procPulse * 0.45, 1);

        headGroup.rotation.y = Math.sin(t * 1.4) * 0.06;
        headGroup.rotation.x = -0.015;
        headGroup.rotation.z = 0;
      } else if (currentState === 'speaking') {
        // Speech-amplitude & timing driven vocal red visor expansion
        const envAmp = Math.max(
          speechAmp,
          0.25 + 0.35 * Math.abs(Math.sin(t * 11.5)) * Math.cos(t * 3.8)
        );
        visorRedCoreMat.color.setHex(envAmp > 0.55 ? 0xff6666 : 0xff1e1e);
        visorRedCoreMat.opacity = 1.0 * surfaceOpacity;
        visorBloomMat.color.setHex(0xff2626);
        visorBloomMat.opacity = (0.7 + envAmp * 0.3) * surfaceOpacity;
        visorBloomMesh.scale.set(1.0 + envAmp * 0.35, 1.0 + envAmp * 0.75, 1);

        // Imposing slight head nod synchronized with speech cadence
        headGroup.rotation.y = Math.sin(t * 0.95) * 0.07;
        headGroup.rotation.x = Math.sin(t * 3.1) * 0.024 * (0.5 + envAmp);
        headGroup.rotation.z = 0;
      }

      // If user provided a custom local GLB model, animate breathing & gentle nod as well
      if (customGlbGroup.visible) {
        customGlbGroup.position.y = breath * 0.015;
        customGlbGroup.rotation.y = Math.sin(t * 0.65) * 0.06;
      }

      // 6.5 User Pointer Drag Rotation & Wheel Scale Smoothing
      const targetRotY = rotOffsetRef.current.x;
      const targetRotX = Math.max(-0.35, Math.min(0.35, rotOffsetRef.current.y));
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.1;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.1;

      const clampedScale = Math.max(0.65, Math.min(1.55, scaleRef.current));
      const currentScale = rootGroup.scale.x;
      const nextScale = currentScale + (clampedScale - currentScale) * 0.12;
      rootGroup.scale.setScalar(nextScale);

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Interactive Pointer Drag & Wheel Scale
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - prevPointerX) * 0.012;
      const dy = (e.clientY - prevPointerY) * 0.008;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      onPointerRotateRef.current?.(dx, dy);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!onWheelScaleRef.current) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.06 : -0.06;
      onWheelScaleRef.current(delta);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Cleanup WebGL resources & Timer
    return () => {
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);

      if (rafId !== null) cancelAnimationFrame(rafId);
      timer.dispose();
      allDisposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (domEl && container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none touch-none cursor-grab active:cursor-grabbing ${className}`}
      title="GORT 3D Avatar · Drag to rotate · Scroll to scale"
    />
  );
};
