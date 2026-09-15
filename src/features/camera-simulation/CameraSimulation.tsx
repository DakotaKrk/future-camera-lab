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
  type ExposureResult,
  type IsoValue,
  type ShutterSpeed
} from "./cameraExposure";

interface CameraSimulationProps {
  readonly initialSettings?: CameraSettings;
}

type LiveViewScene = "portrait" | "motion";
type NavigationMode = "rotate" | "pan";
type MotionLessonId = "freeze" | "smear" | "panning" | "light-trails";

interface MotionLesson {
  readonly id: MotionLessonId;
  readonly title: string;
  readonly goal: string;
  readonly setting: CameraSettings["shutter"]["label"];
  readonly tip: string;
}

interface MotionRenderModel {
  readonly carSpeedPxPerSecond: number;
  readonly cameraFollowSpeedPxPerSecond: number;
  readonly subjectSmearPx: number;
  readonly backgroundSmearPx: number;
}

interface RangeControlProps {
  readonly label: string;
  readonly valueLabel: string;
  readonly description: string;
  readonly iconLabel: string;
  readonly tickLabels: readonly string[];
  readonly infoText?: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}

interface LiveViewImages {
  readonly background: HTMLImageElement;
  readonly subject: HTMLImageElement;
  readonly motionBackground: HTMLImageElement;
  readonly motionCar: HTMLImageElement;
}

interface DrawImageRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface CameraModelProps {
  readonly settings: CameraSettings;
  readonly liveViewScene: LiveViewScene;
  readonly motionLessonId: MotionLessonId;
}

interface SceneProps extends CameraModelProps {
  readonly navigationMode: NavigationMode;
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
const MOTION_BACKGROUND_IMAGE_PATH = `${BASE_PATH}/assets/images/motion-background.png`;
const MOTION_CAR_IMAGE_PATH = `${BASE_PATH}/assets/images/motion-car.png`;
const LIVE_VIEW_WIDTH = 1024;
const LIVE_VIEW_HEIGHT = 640;
const MOTION_LESSONS: readonly MotionLesson[] = [
  {
    id: "freeze",
    title: "Freeze the car",
    goal: "Make a moving car look sharp.",
    setting: "1/1000",
    tip: "Use a fast shutter. Start around 1/500, then go faster if the car is close."
  },
  {
    id: "smear",
    title: "Show speed",
    goal: "Let the car stretch into motion.",
    setting: "1/30",
    tip: "Use a slower shutter. The longer the shutter stays open, the farther the car moves in the photo."
  },
  {
    id: "panning",
    title: "Sharp car, blurred background",
    goal: "Follow the car while taking the photo.",
    setting: "1/60",
    tip: "Move the camera with the car. The car can stay readable while the background streaks."
  },
  {
    id: "light-trails",
    title: "Light trails",
    goal: "Turn moving lights into lines.",
    setting: "1/4",
    tip: "Use a very slow shutter and keep the camera still. Headlights and reflections become trails."
  }
];

function RangeControl({
  label,
  valueLabel,
  description,
  iconLabel,
  tickLabels,
  infoText,
  min,
  max,
  step = 1,
  value,
  onChange
}: RangeControlProps): JSX.Element {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="grid grid-cols-[42px_1fr] gap-4 border-t border-white/10 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.07] text-xs font-bold text-white/80 shadow-inner">
        {iconLabel}
      </span>
      <span className="block">
        <span className="mb-3 flex items-start justify-between gap-5">
          <span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/90">
              {label}
              {infoText ? (
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/30 text-[10px] normal-case tracking-normal text-slate-300"
                  aria-expanded={isInfoOpen}
                  aria-label={`Show info about ${label}`}
                  onClick={() => setIsInfoOpen((current) => !current)}
                >
                  i
                </button>
              ) : null}
            </span>
            {infoText && isInfoOpen ? (
              <span className="mt-2 block rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium normal-case leading-relaxed tracking-normal text-slate-100">
                {infoText}
              </span>
            ) : null}
            <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-slate-400">
              {description}
            </span>
          </span>
          <strong className="shrink-0 rounded-md border border-white/10 bg-white/[0.07] px-3 py-1.5 text-base font-bold tracking-wide text-amber-300">
            {valueLabel}
          </strong>
        </span>
        <span className="block">
          <input
            className="h-1.5 w-full accent-amber-300"
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span className="mt-1 grid text-[11px] font-medium text-slate-400" style={{ gridTemplateColumns: `repeat(${tickLabels.length}, minmax(0, 1fr))` }}>
            {tickLabels.map((tickLabel) => (
              <span key={tickLabel} className="border-l border-white/20 pt-2 first:border-l-0">
                {tickLabel}
              </span>
            ))}
          </span>
        </span>
      </span>
    </div>
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

function drawImageContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: DrawImageRect): void {
  const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = rect.x + (rect.width - width) / 2;
  const y = rect.y + (rect.height - height) / 2;
  ctx.drawImage(image, x, y, width, height);
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

function getMotionRenderModel(shutterSeconds: number, motionLessonId: MotionLessonId): MotionRenderModel {
  const carSpeedPxPerSecond = motionLessonId === "light-trails" ? 2400 : 1800;
  const cameraFollowRatio = motionLessonId === "panning" ? 0.94 : 0;
  const cameraFollowSpeedPxPerSecond = carSpeedPxPerSecond * cameraFollowRatio;
  const relativeSubjectSpeed = Math.abs(carSpeedPxPerSecond - cameraFollowSpeedPxPerSecond);

  return {
    carSpeedPxPerSecond,
    cameraFollowSpeedPxPerSecond,
    subjectSmearPx: Math.min(640, relativeSubjectSpeed * shutterSeconds),
    backgroundSmearPx: Math.min(520, cameraFollowSpeedPxPerSecond * shutterSeconds)
  };
}

function getShutterSliderValue(shutterSeconds: number): number {
  const lastIndex = SHUTTER_SPEEDS.length - 1;

  for (let index = 0; index < lastIndex; index += 1) {
    const current = SHUTTER_SPEEDS[index] ?? DEFAULT_SETTINGS.shutter;
    const next = SHUTTER_SPEEDS[index + 1] ?? current;
    const maxSeconds = Math.max(current.seconds, next.seconds);
    const minSeconds = Math.min(current.seconds, next.seconds);

    if (shutterSeconds <= maxSeconds && shutterSeconds >= minSeconds) {
      const currentLog = Math.log(current.seconds);
      const nextLog = Math.log(next.seconds);
      return index + (Math.log(shutterSeconds) - currentLog) / (nextLog - currentLog);
    }
  }

  return shutterSeconds > (SHUTTER_SPEEDS[0] ?? DEFAULT_SETTINGS.shutter).seconds ? 0 : lastIndex;
}

function getSmoothShutterSpeed(position: number): ShutterSpeed {
  const lowerIndex = Math.max(0, Math.min(SHUTTER_SPEEDS.length - 1, Math.floor(position)));
  const upperIndex = Math.max(0, Math.min(SHUTTER_SPEEDS.length - 1, Math.ceil(position)));
  const lower = SHUTTER_SPEEDS[lowerIndex] ?? DEFAULT_SETTINGS.shutter;
  const upper = SHUTTER_SPEEDS[upperIndex] ?? lower;
  const progress = position - lowerIndex;
  const seconds = Math.exp(Math.log(lower.seconds) + (Math.log(upper.seconds) - Math.log(lower.seconds)) * progress);
  const denominator = Math.max(4, Math.round(1 / seconds));

  return {
    label: `1/${denominator}`,
    seconds
  };
}

function getShutterSpeedByLabel(label: CameraSettings["shutter"]["label"]): ShutterSpeed {
  return SHUTTER_SPEEDS.find((shutter) => shutter.label === label) ?? DEFAULT_SETTINGS.shutter;
}

function drawMotionBackground(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  backgroundSmearPx: number
): void {
  if (!image) {
    drawFallbackBackground(ctx, 0);
    return;
  }

  if (backgroundSmearPx <= 1) {
    drawImageCover(ctx, image, { x: 0, y: 0, width: LIVE_VIEW_WIDTH, height: LIVE_VIEW_HEIGHT });
    return;
  }

  const sampleCount = Math.max(3, Math.min(24, Math.ceil(backgroundSmearPx / 8)));

  ctx.save();
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const progress = sampleCount === 1 ? 0 : sample / (sampleCount - 1);
    ctx.globalAlpha = 1 / sampleCount;
    drawImageCover(ctx, image, {
      x: progress * backgroundSmearPx - backgroundSmearPx,
      y: 0,
      width: LIVE_VIEW_WIDTH,
      height: LIVE_VIEW_HEIGHT
    });
  }
  ctx.restore();
}

function drawMotionCar(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  motionPhase: number,
  motionModel: MotionRenderModel,
  motionLessonId: MotionLessonId
): void {
  const carX = 1040 - motionPhase * 1500;
  const carRect = { x: carX, y: 336, width: 620, height: 176 };
  const blurDistance = motionModel.subjectSmearPx;
  const sampleCount = Math.max(1, Math.min(34, Math.ceil(blurDistance / 13)));

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.filter = "blur(8px)";
  ctx.beginPath();
  ctx.ellipse(carX + 310, 515, 250, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (image) {
    for (let sample = sampleCount - 1; sample >= 1; sample -= 1) {
      const progress = sampleCount === 1 ? 0 : sample / (sampleCount - 1);
      ctx.save();
      ctx.globalAlpha = motionLessonId === "light-trails" ? Math.max(0.035, 0.45 / sampleCount) : Math.max(0.04, 0.3 / sampleCount);
      ctx.translate(progress * blurDistance, 0);
      drawImageContain(ctx, image, carRect);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = motionLessonId === "light-trails" ? 0.48 : blurDistance > 55 ? 0.72 : 0.96;
    drawImageContain(ctx, image, carRect);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.fillStyle = "#252b30";
  roundedRect(ctx, { x: 184, y: 386, width: 650, height: 92 }, 30);
  ctx.fill();
  ctx.fillStyle = "#111417";
  ctx.beginPath();
  ctx.arc(310, 486, 42, 0, Math.PI * 2);
  ctx.arc(705, 486, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMotionScene(
  ctx: CanvasRenderingContext2D,
  settings: CameraSettings,
  images: LiveViewImages | null,
  motionPhase: number,
  motionLessonId: MotionLessonId
): void {
  const motionModel = getMotionRenderModel(settings.shutter.seconds, motionLessonId);

  drawMotionBackground(ctx, images?.motionBackground ?? null, motionModel.backgroundSmearPx);
  drawMotionCar(ctx, images?.motionCar ?? null, motionPhase, motionModel, motionLessonId);
}

function seededNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function drawIsoSensorNoise(
  ctx: CanvasRenderingContext2D,
  settings: CameraSettings,
  exposure: ExposureResult
): void {
  if (exposure.isoNoiseAmount <= 0) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  const data = imageData.data;
  const luminanceStrength = 5 + exposure.isoNoiseAmount * 30;
  const chromaStrength = exposure.isoColorNoiseAmount * 18;
  const isoSeed = settings.iso * 0.017;

  for (let index = 0; index < data.length; index += 4) {
    const pixelIndex = index / 4;
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const shadowWeight = 0.65 + (1 - luminance / 255) * 0.75;
    const luminanceNoise = (seededNoise(pixelIndex + isoSeed) - 0.5) * luminanceStrength * shadowWeight;
    const redNoise = (seededNoise(pixelIndex * 1.7 + isoSeed + 13) - 0.5) * chromaStrength * shadowWeight;
    const blueNoise = (seededNoise(pixelIndex * 2.1 + isoSeed + 29) - 0.5) * chromaStrength * shadowWeight;

    data[index] = Math.max(0, Math.min(255, red + luminanceNoise + redNoise));
    data[index + 1] = Math.max(0, Math.min(255, green + luminanceNoise));
    data[index + 2] = Math.max(0, Math.min(255, blue + luminanceNoise + blueNoise));
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawExposureResponse(
  ctx: CanvasRenderingContext2D,
  settings: CameraSettings,
  exposure: ExposureResult
): void {
  ctx.save();
  const darkness = exposure.exposureStops < 0
    ? Math.min(0.82, Math.abs(exposure.exposureStops) * 0.115 + exposure.shadowCrushAmount * 0.32)
    : 0;
  const brightness = exposure.exposureStops > 0
    ? Math.min(0.58, exposure.exposureStops * 0.105 + exposure.highlightClippingAmount * 0.2)
    : 0;

  if (darkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darkness.toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  if (brightness > 0) {
    ctx.fillStyle = `rgba(255,246,229,${brightness.toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  if (exposure.highlightClippingAmount > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,255,255,${(exposure.highlightClippingAmount * 0.36).toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
    ctx.globalCompositeOperation = "source-over";
  }

  if (exposure.shadowCrushAmount > 0) {
    ctx.fillStyle = `rgba(0,0,0,${(exposure.shadowCrushAmount * 0.22).toFixed(3)})`;
    ctx.fillRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  }

  drawIsoSensorNoise(ctx, settings, exposure);

  if (exposure.motionStreakPx > 0) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.08, exposure.motionStreakPx * 0.008).toFixed(3)})`;
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

  ctx.restore();
}

function drawLiveViewTexture(
  ctx: CanvasRenderingContext2D,
  texture: THREE.CanvasTexture,
  settings: CameraSettings,
  liveViewScene: LiveViewScene,
  motionLessonId: MotionLessonId,
  motionPhase: number,
  images: LiveViewImages | null
): void {
  const renderSettings: CameraSettings = liveViewScene === "motion"
    ? { ...DEFAULT_SETTINGS, shutter: settings.shutter }
    : settings;
  const exposure = calculateExposure(renderSettings);

  ctx.clearRect(0, 0, LIVE_VIEW_WIDTH, LIVE_VIEW_HEIGHT);
  if (liveViewScene === "motion") {
    drawMotionScene(ctx, renderSettings, images, motionPhase, motionLessonId);
  } else {
    drawPortraitBackground(ctx, exposure.backgroundBlurPx, images);
    drawSharpSubject(ctx, 0, images);
  }
  drawExposureResponse(ctx, renderSettings, exposure);
  drawCameraOverlay(ctx, renderSettings);
  texture.needsUpdate = true;
}

function useLiveViewTexture(
  settings: CameraSettings,
  liveViewScene: LiveViewScene,
  motionLessonId: MotionLessonId
): THREE.CanvasTexture {
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
    Promise.all([
      loadImage(BACKGROUND_IMAGE_PATH),
      loadImage(SUBJECT_IMAGE_PATH),
      loadImage(MOTION_BACKGROUND_IMAGE_PATH),
      loadImage(MOTION_CAR_IMAGE_PATH)
    ])
      .then(([background, subject, motionBackground, motionCar]) => {
        if (active) setImages({ background, subject, motionBackground, motionCar });
      })
      .catch(() => {
        if (active) setImages(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    function renderFrame(time: number): void {
      const motionPhase = liveViewScene === "motion" ? (time * 0.00012) % 1 : 0;
      drawLiveViewTexture(liveView.context, liveView.texture, settings, liveViewScene, motionLessonId, motionPhase, images);

      if (liveViewScene === "motion") {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    }

    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [images, liveView, liveViewScene, motionLessonId, settings]);

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

function StudioEnvironment(): JSX.Element {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#071016" roughness={0.22} metalness={0.52} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.13, 0]}>
        <circleGeometry args={[7.2, 96]} />
        <meshBasicMaterial color="#9fe8ff" transparent opacity={0.055} depthWrite={false} />
      </mesh>

      <gridHelper args={[42, 42, "#2e6475", "#10242c"]} position={[0, -2.115, 0]} />

      <mesh position={[0, -1.98, -2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.28, 128]} />
        <meshBasicMaterial color="#7fdfff" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CameraModel({ settings, liveViewScene, motionLessonId }: CameraModelProps): JSX.Element {
  const gltf = useGLTF(MODEL_PATH) as GLTF;
  const liveViewTexture = useLiveViewTexture(settings, liveViewScene, motionLessonId);
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

function Scene({ settings, liveViewScene, motionLessonId, navigationMode }: SceneProps): JSX.Element {
  const mouseButtons = navigationMode === "pan"
    ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
    : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  const touches = navigationMode === "pan"
    ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
    : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

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
        <CameraModel settings={settings} liveViewScene={liveViewScene} motionLessonId={motionLessonId} />
      </Suspense>

      <StudioEnvironment />
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
        mouseButtons={mouseButtons}
        touches={touches}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.84}
      />
    </>
  );
}

export function CameraSimulation({ initialSettings = DEFAULT_SETTINGS }: CameraSimulationProps): JSX.Element {
  const [settings, setSettings] = useState<CameraSettings>(initialSettings);
  const [liveViewScene, setLiveViewScene] = useState<LiveViewScene>("portrait");
  const [navigationMode, setNavigationMode] = useState<NavigationMode>("rotate");
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [motionLessonId, setMotionLessonId] = useState<MotionLessonId>("freeze");
  const apertureIndex = Math.max(0, APERTURE_VALUES.indexOf(settings.aperture));
  const shutterIndex = getShutterSliderValue(settings.shutter.seconds);
  const isoIndex = Math.max(0, ISO_VALUES.indexOf(settings.iso));

  function updateAperture(index: number): void {
    const aperture = getArrayValue<ApertureValue>(APERTURE_VALUES, index, DEFAULT_SETTINGS.aperture);
    setSettings((current) => ({ ...current, aperture }));
  }

  function updateShutter(index: number): void {
    const shutter = getSmoothShutterSpeed(index);
    setSettings((current) => ({ ...current, shutter }));
  }

  function updateIso(index: number): void {
    const iso = getArrayValue<IsoValue>(ISO_VALUES, index, DEFAULT_SETTINGS.iso);
    setSettings((current) => ({ ...current, iso }));
  }

  function applyMotionLesson(lesson: MotionLesson): void {
    setLiveViewScene("motion");
    setMotionLessonId(lesson.id);
    setSettings((current) => ({ ...current, shutter: getShutterSpeedByLabel(lesson.setting) }));
  }

  return (
    <section className="min-h-screen bg-[#E9ECEF] p-6 text-slate-950">
      <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1680px] overflow-hidden rounded-sm border border-[#C8CED5] bg-[#DDE2E7] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <aside className="flex w-60 shrink-0 flex-col border-r border-slate-100 px-7 py-7">
          <h1 className="mb-14 text-[13px] font-bold uppercase tracking-[0.32em]">Future Camera Lab</h1>
          {["Camera", "Lens", "Sensor", "Exposure", "Scene"].map((item, index) => (
            <div
              key={item}
              className={`mb-4 rounded-md px-5 py-4 text-base ${index === 0 ? "bg-slate-100 font-semibold" : "text-slate-500"}`}
            >
              {item}
            </div>
          ))}
        </aside>

        <main className="flex flex-1 items-center justify-center p-9">
          <div className="relative h-full min-h-[620px] w-full overflow-hidden rounded-lg bg-[#12181F] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_22px_60px_rgba(0,0,0,0.22)]">
            <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-white/10 p-1 text-sm font-medium text-slate-100 backdrop-blur">
              {(["rotate", "pan"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-md px-3 py-2 ${navigationMode === mode ? "bg-white/15 text-white" : "text-slate-300"}`}
                  onClick={() => setNavigationMode(mode)}
                >
                  {mode === "rotate" ? "Rotate" : "Pan"}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-6 top-6 z-10 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-slate-100 backdrop-blur">
              Expand
            </div>

            <Canvas
              camera={{ position: [6.8, 3.4, 9.2], fov: 38, near: 0.05, far: 300 }}
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
              <Scene
                settings={settings}
                liveViewScene={liveViewScene}
                motionLessonId={motionLessonId}
                navigationMode={navigationMode}
              />
            </Canvas>

            <div className="absolute bottom-7 left-7 z-10 max-h-[calc(100%-3.5rem)] w-[26rem] overflow-y-auto rounded-lg border border-white/15 bg-black/48 p-5 text-white shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-white/90">Manual Controls</h2>
                  <p className="mt-1 text-xs font-medium text-slate-400">Exposure training</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
                  Manual
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["portrait", "motion"] as const).map((scene) => (
                  <button
                    key={scene}
                    type="button"
                    className={`rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                      liveViewScene === scene
                        ? "border-amber-300/50 bg-amber-300/15 text-amber-200"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                    }`}
                    onClick={() => setLiveViewScene(scene)}
                  >
                    {scene === "portrait" ? "Portrait" : "Motion"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mb-4 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200"
                onClick={() => setIsLearnOpen((current) => !current)}
              >
                Learn motion blur
              </button>
              {isLearnOpen ? (
                <div className="mb-4 space-y-2 border-b border-white/10 pb-4">
                  {MOTION_LESSONS.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`rounded-md border p-3 ${
                        motionLessonId === lesson.id && liveViewScene === "motion"
                          ? "border-amber-300/40 bg-amber-300/10"
                          : "border-white/10 bg-white/[0.035]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">{lesson.title}</h3>
                        <strong className="rounded border border-white/10 bg-black/20 px-2 py-1 text-xs text-amber-300">
                          {lesson.setting}
                        </strong>
                      </div>
                      <p className="text-xs font-medium text-slate-300">{lesson.goal}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{lesson.tip}</p>
                      <button
                        type="button"
                        className="mt-3 rounded border border-amber-300/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"
                        onClick={() => applyMotionLesson(lesson)}
                      >
                        Try this
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {liveViewScene === "portrait" ? (
                <RangeControl
                  label="Aperture"
                  valueLabel={formatAperture(settings.aperture)}
                  description="Controls depth of field"
                  iconLabel="◉"
                  tickLabels={["f/1.4", "f/2.8", "f/5.6", "f/16"]}
                  infoText="Aperture controls light entering the lens and how blurred the background appears."
                  min={0}
                  max={APERTURE_VALUES.length - 1}
                  value={apertureIndex}
                  onChange={updateAperture}
                />
              ) : null}
              <RangeControl
                label="Shutter"
                valueLabel={settings.shutter.label}
                description={liveViewScene === "motion" ? "Freezes or smears moving subjects" : "Controls motion blur"}
                iconLabel="◷"
                tickLabels={liveViewScene === "motion" ? ["1/4", "1/60", "1/250", "1/500", "1/1000"] : ["1/4", "1/60", "1/250", "1/8000"]}
                infoText="Shutter speed controls how long the sensor receives light and how motion is rendered."
                min={0}
                max={SHUTTER_SPEEDS.length - 1}
                step={0.01}
                value={shutterIndex}
                onChange={updateShutter}
              />
              {liveViewScene === "portrait" ? (
                <RangeControl
                  label="ISO"
                  valueLabel={`ISO ${settings.iso}`}
                  description="Controls signal brightness"
                  iconLabel="ISO"
                  tickLabels={["100", "400", "1600", "6400"]}
                  infoText="ISO brightens the captured signal, but higher ISO can make noise more visible."
                  min={0}
                  max={ISO_VALUES.length - 1}
                  value={isoIndex}
                  onChange={updateIso}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

useGLTF.preload(MODEL_PATH);
