import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { Sparkles, Mic, Volume2, ShieldCheck, Cpu } from 'lucide-react';

interface HolographicAgentCoreProps {
  isActiveVoice?: boolean;
  activePodName?: string;
  podRole?: string;
  voiceEngine?: string;
  channel?: string;
  latencyMs?: number;
  onTapCore?: () => void;
  className?: string;
}

export const HolographicAgentCore: React.FC<HolographicAgentCoreProps> = ({
  isActiveVoice = false,
  activePodName = 'Dr. Ritu Verma',
  podRole = 'Inbound Reception & Smart Handover',
  voiceEngine = 'Kore (Neural TTS)',
  channel = 'Voice Telephony',
  latencyMs = 138,
  onTapCore,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPointerHovered, setIsPointerHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 260;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    // 3. WebGL Renderer with alpha and antialiasing
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Geodesic Wireframe Inner Nucleus
    const nucleusGeom = new THREE.IcosahedronGeometry(1.0, 1);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: 0x00f5a0,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeom, nucleusMat);
    scene.add(nucleusMesh);

    // Inner Glowing Core (solid translucent)
    const innerGeom = new THREE.SphereGeometry(0.55, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      wireframe: false,
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    scene.add(innerMesh);

    // 5. Orbiting Gyro Rings
    const ring1Geom = new THREE.TorusGeometry(1.5, 0.015, 8, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(1.75, 0.012, 8, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // 6. Particle Audio Wave Lattice
    const particleCount = 280;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const emerald = new THREE.Color(0x00f5a0);
    const cyan = new THREE.Color(0x06b6d4);
    const violet = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 2.1 + (Math.random() - 0.5) * 0.4;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Color gradient across particles
      const lerpFactor = i / particleCount;
      const mixedColor = lerpFactor < 0.5 ? emerald.clone().lerp(cyan, lerpFactor * 2) : cyan.clone().lerp(violet, (lerpFactor - 0.5) * 2);
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 7. Animation Loop with Audio Reactivity & Gyro Tilting
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic voice amplitude calculation
      const pulseSpeed = isActiveVoice ? 4.5 : 1.2;
      const pulseAmp = isActiveVoice ? 0.35 : 0.08;
      const scaleDelta = 1 + Math.sin(elapsedTime * pulseSpeed) * pulseAmp;

      // Nucleus rotation & pulsation
      nucleusMesh.rotation.x = elapsedTime * 0.3;
      nucleusMesh.rotation.y = elapsedTime * 0.45;
      nucleusMesh.scale.set(scaleDelta, scaleDelta, scaleDelta);

      innerMesh.rotation.y = -elapsedTime * 0.25;
      const innerScale = 1 + Math.cos(elapsedTime * pulseSpeed * 1.2) * (pulseAmp * 0.8);
      innerMesh.scale.set(innerScale, innerScale, innerScale);

      // Rings precession
      ring1.rotation.z = elapsedTime * 0.2;
      ring1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.8) * 0.15;

      ring2.rotation.z = -elapsedTime * 0.25;
      ring2.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 0.7) * 0.15;

      // Particle audio wave ripple
      const posAttr = particleGeom.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        const wave = Math.sin(elapsedTime * pulseSpeed + i * 0.2) * (isActiveVoice ? 0.25 : 0.05);
        const factor = 1 + wave;

        posArray[i * 3] = ox * factor;
        posArray[i * 3 + 1] = oy * factor;
        posArray[i * 3 + 2] = oz * factor;
      }
      posAttr.needsUpdate = true;
      particleSystem.rotation.y = elapsedTime * 0.08;

      // Smooth pointer/touch tilt damping
      scene.rotation.y += (targetRotationRef.current.x - scene.rotation.y) * 0.06;
      scene.rotation.x += (targetRotationRef.current.y - scene.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. Pointer and Touch Tilt Listeners
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationRef.current = {
        x: relX * 0.7,
        y: relY * 0.5,
      };
    };

    const handlePointerLeave = () => {
      targetRotationRef.current = { x: 0, y: 0 };
      setIsPointerHovered(false);
    };

    const handlePointerEnter = () => {
      setIsPointerHovered(true);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('pointerenter', handlePointerEnter);

    // Context loss handler
    const canvas = renderer.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
    const handleContextRestored = () => {
      animate();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

      nucleusGeom.dispose();
      nucleusMat.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      ring1Geom.dispose();
      ring1Mat.dispose();
      ring2Geom.dispose();
      ring2Mat.dispose();
      particleGeom.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isActiveVoice]);

  return (
    <div
      onClick={onTapCore}
      className={`relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-gradient-to-b from-[#0b1220]/90 via-[#070b14]/95 to-[#030712] shadow-2xl backdrop-blur-xl group cursor-pointer transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10 ${className}`}
    >
      {/* Subtle Background Glow Radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,245,160,0.08),transparent_70%)] pointer-events-none" />

      {/* Top HUD Layer (Zero-Pill Discipline) */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isActiveVoice ? 'bg-emerald-400 opacity-75' : 'bg-cyan-400 opacity-40'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isActiveVoice ? 'bg-emerald-400' : 'bg-cyan-500'}`} />
          </span>
          <span className="font-mono text-[11px] font-semibold text-slate-200 tracking-wide uppercase">
            {isActiveVoice ? 'Audio Active · Inbound Live' : 'Core Ready · Standby'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <span className="text-emerald-400">{latencyMs}ms</span>
          <span>·</span>
          <span>Kore Neural</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-56 sm:h-64 flex items-center justify-center relative touch-none select-none"
      />

      {/* Bottom Floating Info Strip (Semantic Unboxed Text) */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between border-t border-white/5 pt-2 text-xs pointer-events-none">
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm tracking-tight font-display flex items-center gap-1.5">
            {activePodName}
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="text-slate-400 text-[11px] leading-tight">
            {podRole}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="text-cyan-400 font-semibold">{channel}</span>
          <span>·</span>
          <span className="text-emerald-400">Tap to Test</span>
        </div>
      </div>
    </div>
  );
};
