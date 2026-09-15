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
  | "1/1000"
  | "1/2000"
  | "1/4000"
  | "1/6000"
  | "1/8000";

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
  readonly isoNoiseAmount: number;
  readonly motionBlurAmount: number;
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

  return {
    exposureStops,
    exposureMultiplier: clamp(2 ** exposureStops, 0.14, 3.6),
    isoNoiseAmount: clamp(isoStops / 6, 0, 1),
    motionBlurAmount: clamp(Math.log2(settings.shutter.seconds / (1 / 125)) / 5, 0, 1),
    backgroundBlurPx: APERTURE_BLUR_MAP[settings.aperture]
  };
}

export function formatAperture(aperture: ApertureValue): string {
  return `f/${Number.isInteger(aperture) ? aperture : aperture.toFixed(1)}`;
}
