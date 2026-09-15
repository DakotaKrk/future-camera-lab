"use client";

import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import {
  APERTURE_VALUES,
  ISO_VALUES,
  SHUTTER_SPEEDS,
  calculateExposure,
  formatAperture,
  getArrayValue,
  type ApertureValue,
  type CameraSettings,
  type IsoValue,
  type ShutterSpeed
} from "./cameraExposure";

interface CameraSimulationProps {
  readonly initialSettings?: CameraSettings;
}

interface RangeControlProps {
  readonly label: string;
  readonly valueLabel: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}

interface LiveViewImages {
  readonly background: HTMLImageElement;
  readonly subject: HTMLImageElement;
}

interface DrawImageRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface CameraModelProps {
  readonly settings: CameraSettings;
}

type MeshWithMaterial = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;

const DEFAULT_SETTINGS: CameraSettings = {
  aperture: 2.8,
  shutter: SHUTTER_SPEEDS[6] ?? { label: "1/250", seconds: 1 / 250 },
  iso: 100
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MODEL_PATH = `${BASE_PATH}/assets/models/camera.glb`;
const BACKGROUND_IMAGE_PATH = `${BASE_PATH}/assets/images/background.png`;
const SUBJECT_IMAGE_PATH = `${BASE_PATH}/assets/images/subject.png`;
const LIVE_VIEW_WIDTH = 1024;
const LIVE_VIEW_HEIGHT = 640;

function RangeControl({ label, valueLabel, min, max, value, onChange }: RangeControlProps): JSX.Element {
  return (
    <label className="mb-4 block last:mb-0">
      <span className="mb-1 flex justify-between text-xs uppercase tracking-widest text-slate-300">
        {label}
        <strong className="text-white">{valueLabel}</strong>
      </span>
      <input
        className="w-full accent-cyan-200"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function roundedRect(ctx: CanvasRenderingContext2D, rect: DrawImageRect, radius: number): void {
  const { x, y, width, height } = rect;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: DrawImageRect): void {
  const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  const sourceWidth = rect.width / scale;
  const sourceHeight = rect.height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, rect.x, rect.y, rect.width, rect.height);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function drawFallbackBackground(ctx: CanvasRenderingContext2D, overscan: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, LIVE_VIEW_HEIGHT);
  sky.addColorStop(0, "#7f8d94");
  sky.addColorStop(0.46, "#b9aea2");
  sky.addColorStop(1, "#27312c");
  ctx.fillStyle = sky;
  ctx.fillRect(-overscan, -overscan, LIVE_VIEW_WIDTH + overscan * 2, LIVE_VIEW_HEIGHT + overscan * 2);

  ctx.fillStyle = "#53493f";
  ctx.fillRect(-overscan, 250, LIVE_VIEW_WIDTH + overscan * 2, 390 + overscan);

  for (let index = 0; index < 34; index += 1) {
    const x = 24 + index * 31;
    const y = 120 + (index * 47) % 380;
    const radius = 5 + (index % 5) * 3;
    ctx.beginPath();
    ctx.fillStyle = index % 3 === 0 ? "rgba(255,218,145,.72)" : "rgba(218,239,255,.42)";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPortraitBackground(ctx: CanvasRenderingContext2D, blurPx: number, images: LiveViewImages | null): void {
  ctx.save();
  ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
  const overscan = blurPx * 2;

  if (images) {
    drawImageCover(ctx, images.background, {
      x: -overscan,
      y: -overscan,
      width: LIVE_VIEW_WIDTH + overscan * 2,
      height: LIVE_VIEW_HEIGHT + overscan * 2
    });
  } else {
    drawFallbackBackground(ctx, overscan);
  }

  ctx.restore();
}

function drawFallbackSubject(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(520, 352);
  ctx.fillStyle = "rgba(24,28,30,.72)";
  ctx.beginPath();
  ctx.ellipse(0, 168, 176, 128, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c69a7d";
  ctx.beginPath();
  ctx.ellipse(0, -22, 70, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f201b";
  ctx.beginPath();
  ctx.ellipse(-8, -88, 78, 48, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSubjectShape(ctx: CanvasRenderingContext2D, images: LiveViewImages | null): void {
  if (!images) {
    drawFallbackSubject(ctx);
    return;
  }

  ctx.save();
  roundedRect(ctx, { x: 304, y: 56, width: 418, height: 584 }, 16);
  ctx.clip();
  drawImageCover(ctx, images.subject, { x: 276, y: 28, width: 474, height: 670 });

  const fade = ctx.createRadialGradient(512, 290, 120, 512, 310, 380);
  fade.addColorStop(0, "rgba(255,255,255,0)");
  fade.addColorStop(0.72, "rgba(255,255,255,0)");
  fade.addColorStop(1, "rgba(0,0,0,.26)");
  ctx.fillStyle = fade;
  ctx.fillRect(276, 28, 474, 670);
  ctx.restore();
}

function drawSharpSubject(ctx: CanvasRenderingContext2D, motionBlurPx: number, images: LiveViewImages | null): void {
  if (motionBlurPx > 0) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.filter = `blur(${Math.min(motionBlurPx, 9)}px)`;
    ctx.translate(motionBlurPx * 1.7, 0);
    drawSubjectShape(ctx, images);
    ctx.restore();
  }

  drawSubjectShape(ctx, images);
}

function drawExposureResponse(
  ctx: CanvasRenderingContext2D,
  settings: CameraSettings,
  exposureMultiplier: number,
  motionBlurPx: number
): void {
  ctx.save();
  const underExposure = Math.max(0, 1 - exposureMultiplier);
  const overExposure = Math.max(0, exposureMultiplier - 1);
  const darkness = Math.min(0.78, underExposure * 0.58);
  const brightness = Math.min(0.52, overExposure * 0.26);
  const highlightClip = Math.max(0, exposureMultiplier - 2.15);

  if (darkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darkness.toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  if (brightness > 0) {
    ctx.fillStyle = `rgba(255,246,229,${brightness.toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  if (highlightClip > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.28, highlightClip * 0.18).toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
    ctx.globalCompositeOperation = "source-over";
  }

  const isoStops = Math.max(0, Math.log2(settings.iso / 100));
  if (isoStops > 0) {
    const grainAlpha = Math.min(0.42, 0.035 + isoStops * 0.06);
    const speckCount = Math.round(650 + isoStops * 620);
    const shutterSeed = Math.round(settings.shutter.seconds * 1_000_000);
    ctx.globalAlpha = grainAlpha;
    for (let index = 0; index < speckCount; index += 1) {
      const seed = (index * 9301 + settings.iso * 17 + shutterSeed) % 233280;
      const x = (seed * 17) % LIVE_VIEW_WIDTH;
      const y = (seed * 41) % LIVE_VIEW_HEIGHT;
      const warmNoise = index % 5 === 0;
      const coolNoise = index % 7 === 0;
      ctx.fillStyle = warmNoise ? "#ffd6a4" : coolNoise ? "#9edcff" : index % 2 ? "#ffffff" : "#111619";
      ctx.fillRect(x, y, settings.iso >= 3200 && index % 4 === 0 ? 2 : 1, 1);
    }
    ctx.globalAlpha = Math.min(0.24, isoStops * 0.045);
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < LIVE_VIEW_HEIGHT; y += 3) {
      if ((y + settings.iso) % 9 === 0) ctx.fillRect(0, y, LIVE_VIEW_WIDTH, 1);
    }
  }

  if (motionBlurPx > 0) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.08, motionBlurPx * 0.008).toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  ctx.restore();
}

function drawCameraOverlay(ctx: CanvasRenderingContext2D, settings: CameraSettings): void {
  ctx.save();

  const aperture = formatAperture(settings.aperture);
  const shutter = settings.shutter.label;
  const iso = `ISO ${settings.iso}`;
  const vignette = ctx.createRadialGradient(512, 310, 60, 512, 320, 590);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);

  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, 68);
  ctx.fillRect(0, 570, LIVE_VIEW_WIDTH, 70);

  ctx.strokeStyle = "rgba(235,255,246,.88)";
  ctx.lineWidth = 4;
  roundedRect(ctx, { x: 390, y: 238, width: 244, height: 154 }, 10);
  ctx.stroke();
  ctx.lineWidth = 3;
  roundedRect(ctx, { x: 690, y: 292, width: 118, height: 78 }, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(512, 300);
  ctx.lineTo(512, 330);
  ctx.moveTo(497, 315);
  ctx.lineTo(527, 315);
  ctx.stroke();

  ctx.fillStyle = "rgba(246,255,250,.96)";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillText("M", 34, 45);
  ctx.font = "600 24px Arial, sans-serif";
  ctx.fillText(aperture, 215, 45);
  ctx.fillText(shutter, 350, 45);
  ctx.fillText(iso, 520, 45);
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText(aperture, 308, 618);
  ctx.fillText(shutter, 454, 618);
  ctx.fillText(iso, 628, 618);

  ctx.font = "500 22px Arial, sans-serif";
  ctx.fillText("RAW", 792, 44);
  ctx.strokeStyle = "rgba(246,255,250,.9)";
  ctx.lineWidth = 3;
  roundedRect(ctx, { x: 914, y: 22, width: 58, height: 24 }, 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(246,255,250,.72)";
  ctx.fillRect(920, 28, 36, 12);
  ctx.fillRect(974, 29, 5, 10);

  ctx.strokeStyle = "rgba(246,255,250,.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 96);
  ctx.lineTo(56, 144);
  ctx.moveTo(968, 96);
  ctx.lineTo(968, 144);
  ctx.moveTo(56, 496);
  ctx.lineTo(56, 544);
  ctx.moveTo(968, 496);
  ctx.lineTo(968, 544);
  ctx.stroke();
  ctx.restore();
}

function drawLiveViewTexture(
  ctx: CanvasRenderingContext2D,
  texture: THREE.CanvasTexture,
  settings: CameraSettings,
  images: LiveViewImages | null
): void {
  const exposure = calculateExposure(settings);
  const motionBlurPx = exposure.motionBlurAmount * 21;

  ctx.clearRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  drawPortraitBackground(ctx, exposure.backgroundBlurPx, images);
  drawSharpSubject(ctx, motionBlurPx, images);
  drawExposureResponse(ctx, settings, exposure.exposureMultiplier, motionBlurPx);
  drawCameraOverlay(ctx, settings);
  texture.needsUpdate = true;
}

function useLiveViewTexture(settings: CameraSettings): THREE.CanvasTexture {
  const { gl } = useThree();
  const [images, setImages] = useState<LiveViewImages | null>(null);
  const liveView = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = LIVE_VIEW_WIDTH;
    canvas.height = LIVE_VIEW_HEIGHT;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);
    texture.flipY = true;

    return { context, texture };
  }, [gl]);

  useEffect(() => {
    let active = true;
    Promise.all([loadImage(BACKGROUND_IMAGE_PATH), loadImage(SUBJECT_IMAGE_PATH)])
      .then(([background, subject]) => {
        if (active) setImages({ background, subject });
      })
      .catch(() => {
        if (active) setImages(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    drawLiveViewTexture(liveView.context, liveView.texture, settings, images);
  }, [images, liveView, settings]);

  useEffect(() => {
    return () => liveView.texture.dispose();
  }, [liveView]);

  return liveView.texture;
}

function fitModel(scene: THREE.Object3D): void {
  scene.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  scene.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  scene.scale.multiplyScalar(5.8 / maxDimension);
  scene.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(scene);
  scene.position.y += -1.7 - box.min.y;
}

function meshTargetName(mesh: MeshWithMaterial): string {
  const materialName = Array.isArray(mesh.material)
    ? mesh.material.map((material) => material.name).join(" ")
    : mesh.material.name;

  return `${mesh.name} ${materialName}`.toLowerCase();
}

function createScreenMaterial(texture: THREE.CanvasTexture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name: "LiveView Canvas Screen",
    map: texture,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: texture,
    emissiveIntensity: 0.58,
    roughness: 0.36,
    metalness: 0,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true,
    toneMapped: false
  });
}

function isMeshWithMaterial(object: THREE.Object3D): object is MeshWithMaterial {
  return object instanceof THREE.Mesh;
}

function CameraModel({ settings }: CameraModelProps): JSX.Element {
  const gltf = useGLTF(MODEL_PATH) as GLTF;
  const liveViewTexture = useLiveViewTexture(settings);
  const modelScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    fitModel(clone);
    clone.traverse((object) => {
      if (!isMeshWithMaterial(object)) return;

      object.castShadow = true;
      object.receiveShadow = true;
      const targetName = meshTargetName(object);

      if (targetName.includes("fcd__glass_all_0")) {
        object.visible = false;
        return;
      }

      if (targetName.includes("screen")) {
        object.material = createScreenMaterial(liveViewTexture);
      }
    });

    return clone;
  }, [gltf.scene, liveViewTexture]);

  return <primitive object={modelScene} />;
}

function Scene({ settings }: CameraModelProps): JSX.Element {
  return (
    <>
      <fog attach="fog" args={["#071016", 0.014]} />
      <hemisphereLight args={["#ffffff", "#1d2529", 1.62]} />
      <directionalLight position={[-3.5, 5.6, 5.2]} intensity={2.45} castShadow />
      <pointLight position={[3.6, 1.4, 5.8]} color="#f3fbff" intensity={22} distance={18} decay={2.2} />
      <pointLight position={[-2.4, 1.8, -5.6]} color="#ffffff" intensity={28} distance={16} decay={2.1} />
      <pointLight position={[-7, 2.6, -5.2]} color="#dcefff" intensity={44} distance={28} decay={2} />
      <pointLight position={[5, 1, -4]} color="#fff7ec" intensity={12} distance={20} decay={2} />

      <Suspense fallback={null}>
        <CameraModel settings={settings} />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#081116" roughness={0.26} metalness={0.58} />
      </mesh>
      <gridHelper args={[60, 60, "#365664", "#111c22"]} position={[0, -2.14, 0]} />
      <OrbitControls
        enableDamping
        dampingFactor={0.075}
        target={[0, 0.1, 0]}
        minDistance={4.8}
        maxDistance={28}
        zoomSpeed={0.42}
        rotateSpeed={0.74}
        enablePan
        panSpeed={0.72}
        screenSpacePanning
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.84}
      />
    </>
  );
}

export function CameraSimulation({ initialSettings = DEFAULT_SETTINGS }: CameraSimulationProps): JSX.Element {
  const [settings, setSettings] = useState<CameraSettings>(initialSettings);
  const exposure = useMemo(() => calculateExposure(settings), [settings]);
  const apertureIndex = Math.max(0, APERTURE_VALUES.indexOf(settings.aperture));
  const shutterIndex = Math.max(
    0,
    SHUTTER_SPEEDS.findIndex((shutter) => shutter.label === settings.shutter.label)
  );
  const isoIndex = Math.max(0, ISO_VALUES.indexOf(settings.iso));

  function updateAperture(index: number): void {
    const aperture = getArrayValue<ApertureValue>(APERTURE_VALUES, index, DEFAULT_SETTINGS.aperture);
    setSettings((current) => ({ ...current, aperture }));
  }

  function updateShutter(index: number): void {
    const shutter = getArrayValue<ShutterSpeed>(SHUTTER_SPEEDS, index, DEFAULT_SETTINGS.shutter);
    setSettings((current) => ({ ...current, shutter }));
  }

  function updateIso(index: number): void {
    const iso = getArrayValue<IsoValue>(ISO_VALUES, index, DEFAULT_SETTINGS.iso);
    setSettings((current) => ({ ...current, iso }));
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#071016] text-white">
      <div className="pointer-events-none absolute left-6 right-6 top-6 z-10 flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-[0.28em]">Future Camera Lab</h1>
        <span className="hidden text-xs uppercase tracking-[0.28em] text-slate-400 md:block">
          Spatial Photography Learning
        </span>
      </div>

      <Canvas
        camera={{ position: [8.2, 4.15, 11.2], fov: 40, near: 0.05, far: 300 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
        onCreated={({ gl, scene }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          scene.background = new THREE.Color(0x071016);
        }}
      >
        <Scene settings={settings} />
      </Canvas>

      <div className="absolute bottom-6 left-6 z-10 w-80 rounded-lg border border-cyan-100/15 bg-black/45 p-4 shadow-2xl backdrop-blur">
        <RangeControl
          label="Aperture"
          valueLabel={formatAperture(settings.aperture)}
          min={0}
          max={APERTURE_VALUES.length - 1}
          value={apertureIndex}
          onChange={updateAperture}
        />
        <RangeControl
          label="Shutter"
          valueLabel={settings.shutter.label}
          min={0}
          max={SHUTTER_SPEEDS.length - 1}
          value={shutterIndex}
          onChange={updateShutter}
        />
        <RangeControl
          label="ISO"
          valueLabel={`ISO ${settings.iso}`}
          min={0}
          max={ISO_VALUES.length - 1}
          value={isoIndex}
          onChange={updateIso}
        />

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
          <span>Exposure</span>
          <strong className="text-white">{exposure.exposureStops.toFixed(2)} stops</strong>
          <span>ISO noise</span>
          <strong className="text-white">{Math.round(exposure.isoNoiseAmount * 100)}%</strong>
          <span>Motion blur</span>
          <strong className="text-white">{Math.round(exposure.motionBlurAmount * 100)}%</strong>
          <span>Background blur</span>
          <strong className="text-white">{exposure.backgroundBlurPx}px</strong>
        </div>
      </div>
    </section>
  );
}

useGLTF.preload(MODEL_PATH);
