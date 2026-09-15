export type IsoValue = 100 | 200 | 400 | 800 | 1600 | 3200 | 6400;

export type ApertureValue = 1.4 | 1.8 | 2 | 2.8 | 4 | 5.6 | 8 | 11 | 16;

export type ShutterSpeedLabel =
  | "1/4"
  | "1/8"
  | "1/15"
  | "1/30"
  | "1/60"
  | "1/125"
  | "1/250"
  | "1/500"
  | "1/640"
  | "1/800"
  | "1/1000"
  | "1/2000"
  | "1/4000"
  | "1/6000"
  | "1/8000"
  | `1/${number}`;

export interface ShutterSpeed {
  readonly label: ShutterSpeedLabel;
  readonly seconds: number;
}

export interface CameraSettings {
  readonly iso: IsoValue;
  readonly aperture: ApertureValue;
  readonly shutter: ShutterSpeed;
}

export interface ExposureResult {
  readonly exposureStops: number;
  readonly exposureMultiplier: number;
  readonly displayBrightness: number;
  readonly highlightClippingAmount: number;
  readonly shadowCrushAmount: number;
  readonly isoNoiseAmount: number;
  readonly isoColorNoiseAmount: number;
  readonly motionBlurAmount: number;
  readonly motionStreakPx: number;
  readonly backgroundBlurPx: number;
}

export const SHUTTER_SPEEDS: readonly ShutterSpeed[] = [
  { label: "1/4", seconds: 1 / 4 },
  { label: "1/8", seconds: 1 / 8 },
  { label: "1/15", seconds: 1 / 15 },
  { label: "1/30", seconds: 1 / 30 },
  { label: "1/60", seconds: 1 / 60 },
  { label: "1/125", seconds: 1 / 125 },
  { label: "1/250", seconds: 1 / 250 },
  { label: "1/500", seconds: 1 / 500 },
  { label: "1/640", seconds: 1 / 640 },
  { label: "1/800", seconds: 1 / 800 },
  { label: "1/1000", seconds: 1 / 1000 },
  { label: "1/2000", seconds: 1 / 2000 },
  { label: "1/4000", seconds: 1 / 4000 },
  { label: "1/6000", seconds: 1 / 6000 },
  { label: "1/8000", seconds: 1 / 8000 }
] as const;

export const ISO_VALUES: readonly IsoValue[] = [100, 200, 400, 800, 1600, 3200, 6400] as const;

export const APERTURE_VALUES: readonly ApertureValue[] = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16] as const;

const APERTURE_BLUR_MAP: Readonly<Record<ApertureValue, number>> = {
  1.4: 18,
  1.8: 15,
  2: 13,
  2.8: 10,
  4: 7,
  5.6: 4,
  8: 2,
  11: 1,
  16: 0
};

const BASELINE_APERTURE: ApertureValue = 2.8;
const BASELINE_SHUTTER_SECONDS = 1 / 250;
const BASELINE_ISO: IsoValue = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getArrayValue<T>(values: readonly T[], index: number, fallback: T): T {
  return values[index] ?? fallback;
}

export function calculateExposure(settings: CameraSettings): ExposureResult {
  const apertureStops = Math.log2((BASELINE_APERTURE / settings.aperture) ** 2);
  const shutterStops = Math.log2(settings.shutter.seconds / BASELINE_SHUTTER_SECONDS);
  const isoStops = Math.log2(settings.iso / BASELINE_ISO);
  const exposureStops = apertureStops + shutterStops + isoStops;
  const exposureMultiplier = clamp(2 ** exposureStops, 0.08, 5.6);
  const normalizedExposure = clamp((exposureStops + 5) / 10, 0, 1);
  const motionStops = Math.max(0, Math.log2(settings.shutter.seconds / (1 / 125)));

  return {
    exposureStops,
    exposureMultiplier,
    displayBrightness: clamp(0.18 + normalizedExposure * 0.92, 0.12, 1.18),
    highlightClippingAmount: clamp((exposureStops - 1.7) / 3.2, 0, 1),
    shadowCrushAmount: clamp((-exposureStops - 2.1) / 3.4, 0, 1),
    isoNoiseAmount: clamp(isoStops / 6, 0, 1),
    isoColorNoiseAmount: clamp((isoStops - 2) / 4, 0, 1),
    motionBlurAmount: clamp(motionStops / 5, 0, 1),
    motionStreakPx: clamp(motionStops * 5.2, 0, 26),
    backgroundBlurPx: APERTURE_BLUR_MAP[settings.aperture]
  };
}

export function formatAperture(aperture: ApertureValue): string {
  return `f/${Number.isInteger(aperture) ? aperture : aperture.toFixed(1)}`;
}
