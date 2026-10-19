/**
 * LD CAN 3D — the Liquid Death tallboy as a real lit cylinder (three.js via @remotion/three).
 * Label = Luca's front photo, re-projected per column by its angle around the can
 * (public/ld/can-label.jpg, front half centred at u=0.5, back = plain label white,
 * bottom band wrapped). Baked photo shading was flattened so the 3D lights do the shading.
 *
 * All motion values are passed in (computed on the piece's stepped grid), so the can obeys
 * the same twos cadence as everything else. Screen-space placement: pass the can's centre
 * and height in px; the canvas is full-frame 1920x1080 with a fixed camera.
 */
import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";

const W = 1920;
const H = 1080;
const FOV = 30;
const CAM_Z = 10;
const PX_PER_UNIT = H / (2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180)); // ~201.5
const WALL_OVER_R = 5.705; // measured from the photo (wall px / radius px)

/** Label texture PRELOADED at module load (before any frame renders), held with delayRender
 *  until decoded. Every can mount then gets a ready texture synchronously: no first-frame race. */
let LABEL: THREE.Texture | null = null;
if (typeof window !== "undefined") {
  const handle = delayRender("LD can label (preload)");
  const img = new Image();
  img.onload = () => {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    LABEL = t;
    continueRender(handle);
  };
  img.onerror = () => continueRender(handle);
  img.src = staticFile("ld/can-label.jpg");
}

const CanMesh: React.FC<{ r: number; rotY: number; rotX: number; rotZ: number; label: THREE.Texture }> = ({ r, rotY, rotX, rotZ, label }) => {
  const wall = r * WALL_OVER_R;
  const neck = r * 0.32;
  const metal = { color: "#dfe2e6", metalness: 0.45, roughness: 0.3 } as const;
  return (
    <group rotation={[rotX, rotY, rotZ]}>
      {/* labelled wall; base rotation PI puts the photo's front (u=0.5) toward camera */}
      <mesh rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[r, r, wall, 96, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.28} metalness={0.15} side={THREE.FrontSide} />
      </mesh>
      {/* tapered neck + lid */}
      <mesh position={[0, wall / 2 + neck / 2, 0]}>
        <cylinderGeometry args={[r * 0.84, r, neck, 96, 1, true]} />
        <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, wall / 2 + neck, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.84, 96]} />
        <meshStandardMaterial color="#c9cdd2" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, wall / 2 + neck + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.74, r * 0.84, 96]} />
        <meshStandardMaterial color="#eef0f2" metalness={0.45} roughness={0.25} />
      </mesh>
      {/* base taper */}
      <mesh position={[0, -wall / 2 - neck * 0.35, 0]}>
        <cylinderGeometry args={[r, r * 0.86, neck * 0.7, 96, 1, true]} />
        <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const LdCan3D: React.FC<{
  cx: number; // screen px of the can centre
  cy: number;
  height: number; // total screen height in px
  rotY: number; // radians, 0 = label facing camera
  rotX?: number;
  rotZ?: number;
  rimColor?: string;
  /** canvas size (defaults to the 16:9 frame; pass 1080x1920 for vertical cuts) */
  frameW?: number;
  frameH?: number;
}> = ({ cx, cy, height, rotY, rotX = 0.06, rotZ = 0, rimColor = "#7FC9DC", frameW = W, frameH = H }) => {
  const label = LABEL;
  // vertical fov is fixed, so px-per-unit follows the canvas HEIGHT
  const ppu = frameH === H ? PX_PER_UNIT : frameH / (2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180));
  const total = height / ppu;
  const r = total / (WALL_OVER_R + 0.32 + 0.25);
  const x = (cx - frameW / 2) / ppu;
  const y = (frameH / 2 - cy) / ppu;
  return (
    <ThreeCanvas flat width={frameW} height={frameH} camera={{ position: [0, 0, CAM_Z], fov: FOV }} style={{ position: "absolute", left: 0, top: 0 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-4, 3, 6]} intensity={1.35} />
      <directionalLight position={[5, 1.5, -4]} intensity={2.2} color={rimColor} />
      <directionalLight position={[-6, -1, -3]} intensity={0.9} color={rimColor} />
      <pointLight position={[2, 4, 4]} intensity={8} distance={14} />
      {label ? (
        <group position={[x, y, 0]}>
          <CanMesh r={r} rotY={rotY} rotX={rotX} rotZ={rotZ} label={label} />
        </group>
      ) : null}
    </ThreeCanvas>
  );
};
