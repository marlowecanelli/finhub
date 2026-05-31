"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Icosahedron,
  MeshDistortMaterial,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";

type SceneProps = {
  /** When true, rotation and mouse parallax are disabled (prefers-reduced-motion). */
  reducedMotion: boolean;
};

// Brand palette — emerald "signal" accent over near-black, with a cool blue fill.
const EMERALD = "#10b981";
const DEEP = "#06281d";
const BLUE = "#3b82f6";

/**
 * The abstract form: a softly-lit, slowly-distorting low-poly icosahedron with a
 * faint wireframe shell. It sits behind the headline as atmosphere, never the focus.
 */
function AbstractForm({ reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    if (reducedMotion) {
      // Hold a pleasing static pose — no rotation, no parallax.
      g.rotation.set(0.2, 0.4, 0);
      g.position.set(0, 0, 0);
      return;
    }

    // Slow continuous rotation.
    g.rotation.y += delta * 0.08;
    g.rotation.x += delta * 0.03;

    // Subtle parallax toward the cursor — eased, restrained.
    g.position.x += (pointer.x * 0.25 - g.position.x) * 0.04;
    g.position.y += (pointer.y * 0.2 - g.position.y) * 0.04;
  });

  return (
    <group ref={group}>
      {/* Solid distorted core */}
      <Icosahedron args={[1.6, 4]}>
        <MeshDistortMaterial
          color={DEEP}
          emissive={EMERALD}
          emissiveIntensity={0.18}
          roughness={0.4}
          metalness={0.6}
          distort={reducedMotion ? 0.18 : 0.32}
          speed={reducedMotion ? 0 : 1.1}
        />
      </Icosahedron>

      {/* Faint wireframe shell, slightly larger */}
      <Icosahedron args={[1.95, 1]}>
        <meshBasicMaterial
          color={EMERALD}
          wireframe
          transparent
          opacity={0.12}
        />
      </Icosahedron>
    </group>
  );
}

export default function Hero3DScene({ reducedMotion }: SceneProps) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      {/* Scale render resolution down on weaker devices, back up on strong ones. */}
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />

      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 3, 5]} intensity={1.1} color={EMERALD} />
      <pointLight position={[-5, -2, 2]} intensity={1.4} color={BLUE} />
      <pointLight position={[0, 4, -3]} intensity={0.6} color={"#ffffff"} />

      <Suspense fallback={null}>
        <AbstractForm reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}
