import { describe, expect, it } from "vitest";
import {
  SHUTTER_SPEEDS,
  calculateExposure,
  formatAperture,
  getArrayValue,
  type CameraSettings
} from "./cameraExposure";

function shutter(label: CameraSettings["shutter"]["label"]): CameraSettings["shutter"] {
  const match = SHUTTER_SPEEDS.find((value) => value.label === label);

  if (!match) {
    throw new Error(`Missing shutter speed: ${label}`);
  }

  return match;
}

describe("calculateExposure", () => {
  it("returns neutral exposure for the baseline camera settings", () => {
    const result = calculateExposure({
      aperture: 2.8,
      shutter: shutter("1/250"),
      iso: 100
    });

    expect(result.exposureStops).toBeCloseTo(0, 5);
    expect(result.exposureMultiplier).toBeCloseTo(1, 5);
    expect(result.isoNoiseAmount).toBe(0);
    expect(result.motionBlurAmount).toBe(0);
    expect(result.backgroundBlurPx).toBe(10);
  });

  it("increases exposure and noise when ISO increases", () => {
    const result = calculateExposure({
      aperture: 2.8,
      shutter: shutter("1/250"),
      iso: 800
    });

    expect(result.exposureStops).toBeCloseTo(3, 5);
    expect(result.exposureMultiplier).toBe(3.6);
    expect(result.isoNoiseAmount).toBeCloseTo(0.5, 5);
  });

  it("reduces exposure when aperture is stopped down", () => {
    const result = calculateExposure({
      aperture: 5.6,
      shutter: shutter("1/250"),
      iso: 100
    });

    expect(result.exposureStops).toBeCloseTo(-2, 5);
    expect(result.exposureMultiplier).toBeCloseTo(0.25, 5);
    expect(result.backgroundBlurPx).toBe(4);
  });

  it("adds motion blur for slow shutter speeds", () => {
    const result = calculateExposure({
      aperture: 2.8,
      shutter: shutter("1/4"),
      iso: 100
    });

    expect(result.exposureStops).toBeGreaterThan(5);
    expect(result.motionBlurAmount).toBeGreaterThan(0.9);
  });

  it("keeps very fast shutter speeds free from motion blur", () => {
    const result = calculateExposure({
      aperture: 2.8,
      shutter: shutter("1/6000"),
      iso: 100
    });

    expect(result.exposureStops).toBeLessThan(-4);
    expect(result.motionBlurAmount).toBe(0);
  });
});

describe("formatAperture", () => {
  it("formats decimal aperture values", () => {
    expect(formatAperture(1.4)).toBe("f/1.4");
    expect(formatAperture(2.8)).toBe("f/2.8");
  });

  it("formats whole-number aperture values", () => {
    expect(formatAperture(4)).toBe("f/4");
    expect(formatAperture(16)).toBe("f/16");
  });
});

describe("getArrayValue", () => {
  it("returns the selected value for a valid index", () => {
    expect(getArrayValue(["a", "b", "c"] as const, 1, "a")).toBe("b");
  });

  it("returns the fallback for an invalid index", () => {
    expect(getArrayValue(["a", "b", "c"] as const, 99, "a")).toBe("a");
  });
});
