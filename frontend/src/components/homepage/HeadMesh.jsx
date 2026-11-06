import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TextureLoader,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const INTERACTION_ZONES = [
  {
    id: 'invoice',
    label: 'Invoice Intelligence',
    eyebrow: 'ZONE 01 · FOREHEAD',
    description: 'Automated OCR extraction, vendor verification & line item reconciliation',
    position: [0.0, 0.50, 0.58],
    pathwayIndex: 0,
  },
  {
    id: 'transactions',
    label: 'Transaction Intelligence',
    eyebrow: 'ZONE 02 · TEMPLE',
    description: 'Continuous pattern categorization with machine confidence metrics',
    position: [0.34, 0.22, 0.25],
    pathwayIndex: 1,
  },
  {
    id: 'anomalies',
    label: 'Anomaly Detection',
    eyebrow: 'ZONE 03 · OCCIPITAL',
    description: 'Behavioral variance flags, duplicate signals & human-in-the-loop review',
    position: [-0.29, 0.31, -0.36],
    pathwayIndex: 2,
  },
  {
    id: 'forecast',
    label: 'Cash-Flow Forecasting',
    eyebrow: 'ZONE 04 · MANDIBLE',
    description: 'Predictive 7–90 day cash outlook based on verified account history',
    position: [0.17, -0.14, 0.36],
    pathwayIndex: 3,
  },
];

// Internal neural pathways connecting the cognitive cranial core to anatomical zones
const neuralPathways = [
  // 0: Core to Forehead (Zone 01)
  [
    [0.0, 0.32, -0.05],
    [0.01, 0.38, 0.18],
    [0.01, 0.44, 0.38],
    [0.0, 0.50, 0.58],
  ],
  // 1: Core to Temple Right (Zone 02)
  [
    [0.0, 0.32, -0.05],
    [0.12, 0.30, 0.05],
    [0.24, 0.26, 0.15],
    [0.34, 0.22, 0.25],
  ],
  // 2: Core to Occipital / Back of Head (Zone 03)
  [
    [0.0, 0.32, -0.05],
    [-0.10, 0.32, -0.16],
    [-0.20, 0.31, -0.28],
    [-0.29, 0.31, -0.36],
  ],
  // 3: Core to Jaw / Mandible (Zone 04)
  [
    [0.0, 0.32, -0.05],
    [0.06, 0.16, 0.10],
    [0.12, 0.0, 0.24],
    [0.17, -0.14, 0.36],
  ],
  // 4: Parietal dorsal branch
  [
    [0.0, 0.32, -0.05],
    [0.0, 0.52, -0.08],
    [0.0, 0.68, -0.06],
  ],
  // 5: Left temporal balance
  [
    [0.0, 0.32, -0.05],
    [-0.15, 0.30, 0.05],
    [-0.30, 0.26, 0.16],
  ],
  // 6: Frontal lateral branch right
  [
    [0.02, 0.38, 0.18],
    [0.16, 0.42, 0.32],
    [0.22, 0.46, 0.42],
  ],
  // 7: Frontal lateral branch left
  [
    [0.02, 0.38, 0.18],
    [-0.14, 0.41, 0.32],
    [-0.20, 0.45, 0.41],
  ],
];

// Synaptic node positions throughout cranial cavity
const synapticNodes = [
  [0.0, 0.32, -0.05],
  [0.02, 0.38, 0.18],
  [0.01, 0.44, 0.38],
  [0.12, 0.30, 0.05],
  [0.24, 0.26, 0.15],
  [-0.10, 0.32, -0.16],
  [-0.20, 0.31, -0.28],
  [0.06, 0.16, 0.10],
  [0.12, 0.0, 0.24],
  [0.0, 0.52, -0.08],
  [-0.15, 0.30, 0.05],
  [0.16, 0.42, 0.32],
  [-0.14, 0.41, 0.32],
];

// Neural Filament Mesh with dynamic glow and subtle breathing
function NeuralFilament({ curve, active, hovered, color = '#34d399' }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    return new TubeGeometry(curve, 36, active ? 0.007 : hovered ? 0.006 : 0.0045, 6, false);
  }, [curve, active, hovered]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const pulse = Math.sin(time * 2.2) * 0.15 + 0.85;

    if (active) {
      meshRef.current.material.opacity = Math.min(1.0, 0.85 * pulse + 0.15);
    } else if (hovered) {
      meshRef.current.material.opacity = Math.min(0.9, 0.65 * pulse);
    } else {
      meshRef.current.material.opacity = 0.38 * pulse;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color={active ? '#6ee7b7' : hovered ? '#a7f3d0' : color}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

// Traveling Neural Energy Packet (Animation 02 — Neural Pulse)
function NeuralSignalPulse({ curve, active, hovered, speed = 0.35, offset = 0 }) {
  const pulseRef = useRef();
  const tempPos = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const time = state.clock.elapsedTime;
    const currentSpeed = active ? speed * 1.6 : hovered ? speed * 1.2 : speed;
    const t = (time * currentSpeed + offset) % 1.0;

    // Sample exact 3D position along CatmullRom curve
    curve.getPointAt(t, tempPos);
    pulseRef.current.position.copy(tempPos);

    // Dynamic scale: expands slightly at midpoint, tapers at ends
    const arcScale = Math.sin(t * Math.PI);
    const baseScale = active ? 0.024 : hovered ? 0.018 : 0.012;
    const currentScale = baseScale * (0.6 + 0.8 * arcScale);
    pulseRef.current.scale.set(currentScale, currentScale, currentScale);

    // Pulse brightness
    if (pulseRef.current.material) {
      pulseRef.current.material.opacity = (active ? 0.95 : 0.7) * arcScale;
    }
  });

  return (
    <mesh ref={pulseRef}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial
        color={active ? '#6ee7b7' : '#22d3ee'}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </mesh>
  );
}

// Synaptic Junction Node with harmonic pulsation
function SynapticNodeMesh({ position, active, hovered, index }) {
  const meshRef = useRef();
  const baseScale = active ? 0.026 : hovered ? 0.022 : 0.015;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const pulse = Math.sin(time * 2.5 + index * 0.65) * 0.22 + 1.0;
    const targetScale = baseScale * pulse;
    meshRef.current.scale.set(targetScale, targetScale, targetScale);

    if (meshRef.current.material) {
      const glow = Math.sin(time * 2.5 + index * 0.65) * 0.2 + 0.8;
      meshRef.current.material.opacity = (active ? 0.95 : hovered ? 0.85 : 0.6) * glow;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshBasicMaterial
        color={active ? '#a7f3d0' : hovered ? '#6ee7b7' : '#22d3ee'}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

// Hotspot Anchor with Animated Concentric Ripples (Animation 04 — Hotspot Ripple)
function HotspotAnchor({
  zone,
  isSelected,
  isHovered,
  onPointerOver,
  onPointerOut,
  onClick,
  onUpdateScreenPos,
}) {
  const anchorRef = useRef();
  const ripple1Ref = useRef();
  const ripple2Ref = useRef();
  const coreRef = useRef();
  const { camera, size } = useThree();
  const tempVec = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Ripple 1 (continuous harmonic wave)
    if (ripple1Ref.current) {
      const r1 = (time * 1.8) % 1.0;
      const s1 = (isSelected ? 0.035 : isHovered ? 0.03 : 0.024) * (1.0 + r1 * 2.2);
      ripple1Ref.current.scale.set(s1, s1, s1);
      ripple1Ref.current.material.opacity = (1.0 - r1) * (isSelected ? 0.65 : isHovered ? 0.5 : 0.28);
    }

    // Ripple 2 (secondary phase-shifted wave)
    if (ripple2Ref.current) {
      const r2 = (time * 1.8 + 0.5) % 1.0;
      const s2 = (isSelected ? 0.035 : isHovered ? 0.03 : 0.024) * (1.0 + r2 * 2.2);
      ripple2Ref.current.scale.set(s2, s2, s2);
      ripple2Ref.current.material.opacity = (1.0 - r2) * (isSelected ? 0.45 : isHovered ? 0.35 : 0.18);
    }

    // Core pulsing dot
    if (coreRef.current) {
      const corePulse = Math.sin(time * 3.5) * 0.15 + 1.0;
      const coreBase = isSelected ? 0.024 : isHovered ? 0.02 : 0.015;
      coreRef.current.scale.set(coreBase * corePulse, coreBase * corePulse, coreBase * corePulse);
    }

    // Real-time camera 3D-to-screen projection for connecting line tracking
    if (anchorRef.current && (isSelected || isHovered)) {
      anchorRef.current.getWorldPosition(tempVec);
      tempVec.project(camera);
      const screenX = (tempVec.x * 0.5 + 0.5) * size.width;
      const screenY = (-tempVec.y * 0.5 + 0.5) * size.height;
      onUpdateScreenPos(zone.id, { x: screenX, y: screenY, inFront: tempVec.z < 1 });
    }
  });

  return (
    <group ref={anchorRef} position={zone.position}>
      {/* Invisible larger hit target for forgiving interaction */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver(zone.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(zone.id);
        }}
      >
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Ripple Wave 1 */}
      <mesh ref={ripple1Ref}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial
          color={isSelected ? '#34d399' : isHovered ? '#6ee7b7' : '#06b6d4'}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Ripple Wave 2 (offset) */}
      <mesh ref={ripple2Ref}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial
          color={isSelected ? '#6ee7b7' : isHovered ? '#a7f3d0' : '#22d3ee'}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Glowing Core Dot */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : isHovered ? '#ecfdf5' : '#22d3ee'}
          transparent
          opacity={0.98}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Scanning Light Effect (Animation 08 — Head Scanning Effect)
function SubtleHeadScanner() {
  const scanLightRef = useRef();

  useFrame((state) => {
    if (!scanLightRef.current) return;
    const time = state.clock.elapsedTime;
    // Occasional 10-second sweep cycle: active for 2.2s, calm for 7.8s
    const cycle = (time % 10.0) / 10.0;

    if (cycle < 0.22) {
      const progress = cycle / 0.22; // 0.0 to 1.0
      // Moves smoothly from top of skull (+0.8) to mandible (-0.4)
      scanLightRef.current.position.y = MathUtils.lerp(0.85, -0.45, progress);
      // Bell-curve intensity: soft rise and fall
      const intensityCurve = Math.sin(progress * Math.PI);
      scanLightRef.current.intensity = intensityCurve * 5.5;
    } else {
      scanLightRef.current.intensity = 0;
    }
  });

  return (
    <pointLight
      ref={scanLightRef}
      position={[0.1, 0.85, 0.65]}
      color="#a7f3d0"
      distance={2.8}
      intensity={0}
    />
  );
}

export default function HeadMesh({
  selectedZone,
  hoveredZone,
  onHover,
  onUnhover,
  onSelect,
  onUpdateScreenPos,
  motionEnabled = true,
  pointerInside = true,
}) {
  const headGroupRef = useRef();
  const [headGeometry, setHeadGeometry] = useState(null);
  const [normalMapTexture, setNormalMapTexture] = useState(null);

  // Precompute CatmullRom curves for neural pathways
  const splineCurves = useMemo(() => {
    return neuralPathways.map((pts) => {
      return new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z)));
    });
  }, []);

  // Load the authentic 3D human head scan (Lee Perry-Smith)
  useEffect(() => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/LeePerrySmith.glb',
      (gltf) => {
        let extractedGeometry = null;
        gltf.scene.traverse((child) => {
          if (child.isMesh && !extractedGeometry) {
            extractedGeometry = child.geometry.clone();
          }
        });

        if (extractedGeometry) {
          extractedGeometry.computeVertexNormals();
          extractedGeometry.center();
          setHeadGeometry(extractedGeometry);
        }
      },
      undefined,
      (err) => {
        console.warn('GLB load failed, falling back to procedural sculpture', err);
      }
    );

    const textureLoader = new TextureLoader();
    textureLoader.load(
      '/LeePerrySmith_normal.jpg',
      (tex) => {
        setNormalMapTexture(tex);
      },
      undefined,
      () => {}
    );
  }, []);

  // Material: Smoked Translucent Glass & Deep Emerald Graphite
  const glassMaterial = useMemo(() => {
    return new MeshPhysicalMaterial({
      color: new Color('#0d3b30'),
      emissive: new Color('#031912'),
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.32,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      transmission: 0.62,
      ior: 1.48,
      thickness: 1.6,
      attenuationColor: new Color('#075b48'),
      attenuationDistance: 1.1,
      transparent: true,
      opacity: 0.92,
      normalMap: normalMapTexture || null,
      normalScale: new Vector2(0.65, 0.65),
      side: DoubleSide,
    });
  }, [normalMapTexture]);

  // Subtle CAD / Neural Edge Contour Overlay
  const wireframeMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color('#22d3ee'),
      wireframe: true,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
    });
  }, []);

  // ANIMATION 01 (Natural Rotation) & ANIMATION 03 (Mouse Tracking Parallax)
  useFrame((state, delta) => {
    if (!headGroupRef.current) return;

    if (!motionEnabled) {
      headGroupRef.current.rotation.set(0.04, 0.38, 0.0);
      return;
    }

    const time = state.clock.elapsedTime;

    // Organic multi-frequency breathing motion
    // Primary slow yaw drift (~0.035 rad/s) + gentle harmonic sway
    const breathingYaw = Math.sin(time * 0.18) * 0.14 + Math.sin(time * 0.41) * 0.04;
    const breathingPitch = Math.sin(time * 0.24) * 0.035;
    const breathingRoll = Math.sin(time * 0.20) * 0.02;

    // Base orientation (elegant 3/4 angle)
    const baseYaw = 0.42;

    // Interactive pointer parallax: smoothly responds to mouse when pointer is inside
    // When pointer leaves the scene, pointerActive fades to 0, returning to idle orientation
    const pointerInfluence = pointerInside ? 1.0 : 0.0;
    const targetY = baseYaw + breathingYaw + state.pointer.x * 0.18 * pointerInfluence;
    const targetX = 0.02 + breathingPitch + state.pointer.y * 0.10 * pointerInfluence;
    const targetZ = breathingRoll - state.pointer.x * 0.04 * pointerInfluence;

    // Smooth damping interpolation (lambda = 2.8 gives natural fluid response)
    headGroupRef.current.rotation.y = MathUtils.damp(headGroupRef.current.rotation.y, targetY, 2.8, delta);
    headGroupRef.current.rotation.x = MathUtils.damp(headGroupRef.current.rotation.x, targetX, 2.8, delta);
    headGroupRef.current.rotation.z = MathUtils.damp(headGroupRef.current.rotation.z, targetZ, 2.8, delta);
  });

  return (
    <group ref={headGroupRef} position={[-0.22, -0.08, 0]}>
      {/* Soft Internal Neural Illumination */}
      <pointLight position={[0.0, 0.32, 0.0]} intensity={14} color="#34d399" distance={3.8} />
      <pointLight position={[0.15, 0.42, 0.12]} intensity={7} color="#22d3ee" distance={3.0} />

      {/* Occasional Subtle Facial Scanning Light */}
      <SubtleHeadScanner />

      {/* Internal Neural Filaments & Traveling Information Pulses */}
      <group>
        {splineCurves.map((curve, idx) => {
          const isSelected =
            (selectedZone === 'invoice' && idx === 0) ||
            (selectedZone === 'transactions' && idx === 1) ||
            (selectedZone === 'anomalies' && idx === 2) ||
            (selectedZone === 'forecast' && idx === 3);

          const isHovered =
            (hoveredZone === 'invoice' && idx === 0) ||
            (hoveredZone === 'transactions' && idx === 1) ||
            (hoveredZone === 'anomalies' && idx === 2) ||
            (hoveredZone === 'forecast' && idx === 3);

          return (
            <group key={idx}>
              {/* The 3D neural tube */}
              <NeuralFilament
                curve={curve}
                active={isSelected}
                hovered={isHovered}
                color={idx < 4 ? '#34d399' : '#14b8a6'}
              />

              {/* Traveling Light Pulse Packet (Animation 02) */}
              <NeuralSignalPulse
                curve={curve}
                active={isSelected}
                hovered={isHovered}
                speed={0.28 + (idx % 3) * 0.06}
                offset={idx * 0.22}
              />

              {/* Second offset pulse on active or key pathways */}
              {(isSelected || idx < 4) && (
                <NeuralSignalPulse
                  curve={curve}
                  active={isSelected}
                  hovered={isHovered}
                  speed={0.28 + (idx % 3) * 0.06}
                  offset={idx * 0.22 + 0.5}
                />
              )}
            </group>
          );
        })}

        {/* Synaptic Junction Nodes */}
        {synapticNodes.map((pos, idx) => (
          <SynapticNodeMesh
            key={idx}
            position={pos}
            index={idx}
            active={Boolean(selectedZone)}
            hovered={Boolean(hoveredZone)}
          />
        ))}
      </group>

      {/* Real Anatomical Human Head Mesh */}
      {headGeometry && (
        <group scale={[0.28, 0.28, 0.28]} position={[0, 0, 0]}>
          <mesh geometry={headGeometry} material={glassMaterial} castShadow receiveShadow />
          <mesh geometry={headGeometry} material={wireframeMaterial} scale={[1.002, 1.002, 1.002]} />
        </group>
      )}

      {/* 4 Interactive Hotspot Anchors directly mapped to anatomical zones */}
      {INTERACTION_ZONES.map((zone) => (
        <HotspotAnchor
          key={zone.id}
          zone={zone}
          isSelected={selectedZone === zone.id}
          isHovered={hoveredZone === zone.id}
          onPointerOver={onHover}
          onPointerOut={onUnhover}
          onClick={onSelect}
          onUpdateScreenPos={onUpdateScreenPos}
        />
      ))}
    </group>
  );
}
