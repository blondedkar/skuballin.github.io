"use client";

import { useEffect, useRef } from "react";

import { useGraphicsMode } from "./providers/GraphicsModeProvider";
import styles from "./CanvasLayer.module.css";

class Grad {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  dot3(x: number, y: number, z: number) {
    return this.x * x + this.y * y + this.z * z;
  }
}

const grad3 = [
  new Grad(1, 1, 0),
  new Grad(-1, 1, 0),
  new Grad(1, -1, 0),
  new Grad(-1, -1, 0),
  new Grad(1, 0, 1),
  new Grad(-1, 0, 1),
  new Grad(1, 0, -1),
  new Grad(-1, 0, -1),
  new Grad(0, 1, 1),
  new Grad(0, -1, 1),
  new Grad(0, 1, -1),
  new Grad(0, -1, -1),
];

const p = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36,
  103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0,
  26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56,
  87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77,
  146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46,
  245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187,
  208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173,
  186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85,
  212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
  248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39,
  253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
  251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
  14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
  50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141,
  128, 195, 78, 66, 215, 61, 156, 180,
];

const perm = new Array<number>(512);
const gradP = new Array<Grad>(512);

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

const seedNoise = (seedValue: number) => {
  let seed = seedValue;

  if (seed > 0 && seed < 1) {
    seed *= 65536;
  }

  seed = Math.floor(seed);

  if (seed < 256) {
    seed |= seed << 8;
  }

  for (let i = 0; i < 256; i += 1) {
    const value = i & 1 ? p[i] ^ (seed & 255) : p[i] ^ ((seed >> 8) & 255);
    perm[i] = perm[i + 256] = value;
    gradP[i] = gradP[i + 256] = grad3[value % 12];
  }
};

const perlin3 = (xin: number, yin: number, zin: number) => {
  let x = xin;
  let y = yin;
  let z = zin;
  let cellX = Math.floor(x);
  let cellY = Math.floor(y);
  let cellZ = Math.floor(z);

  x -= cellX;
  y -= cellY;
  z -= cellZ;

  cellX &= 255;
  cellY &= 255;
  cellZ &= 255;

  const n000 = gradP[cellX + perm[cellY + perm[cellZ]]].dot3(x, y, z);
  const n001 = gradP[cellX + perm[cellY + perm[cellZ + 1]]].dot3(x, y, z - 1);
  const n010 = gradP[cellX + perm[cellY + 1 + perm[cellZ]]].dot3(x, y - 1, z);
  const n011 = gradP[cellX + perm[cellY + 1 + perm[cellZ + 1]]].dot3(x, y - 1, z - 1);
  const n100 = gradP[cellX + 1 + perm[cellY + perm[cellZ]]].dot3(x - 1, y, z);
  const n101 = gradP[cellX + 1 + perm[cellY + perm[cellZ + 1]]].dot3(x - 1, y, z - 1);
  const n110 = gradP[cellX + 1 + perm[cellY + 1 + perm[cellZ]]].dot3(x - 1, y - 1, z);
  const n111 = gradP[cellX + 1 + perm[cellY + 1 + perm[cellZ + 1]]].dot3(x - 1, y - 1, z - 1);

  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  return lerp(
    lerp(lerp(n000, n100, u), lerp(n001, n101, u), w),
    lerp(lerp(n010, n110, u), lerp(n011, n111, u), w),
    v,
  );
};

const getValue = (x: number, y: number, z: number, scale: number) =>
  perlin3(x * scale, y * scale, z * scale) * Math.PI * 2;

const mixChannel = (from: number, to: number, amount: number) => from * (1 - amount) + to * amount;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const getLuminance = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const getAdaptiveNeutral = (backgroundLuminance: number) => {
  const contrastBoost = 1 - clamp01(backgroundLuminance);
  const channel = Math.round(86 + contrastBoost * 116);

  return { r: channel, g: channel, b: Math.min(channel + 6, 255) };
};

const getCssNumber = (styles: CSSStyleDeclaration, propertyName: string, fallback: number) => {
  const value = Number.parseFloat(styles.getPropertyValue(propertyName));

  return Number.isFinite(value) ? value : fallback;
};

const hexToRgb = (value: string) => {
  const normalized = value.trim();

  if (!normalized.startsWith("#")) {
    return { r: 255, g: 255, b: 255 };
  }

  const hex = normalized.slice(1);
  const parsed =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  const int = Number.parseInt(parsed, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

export function CanvasLayer() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRevealProgressRef = useRef(0);
  const { mode } = useGraphicsMode();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const accentColor = hexToRgb(rootStyles.getPropertyValue("--color-accent"));
    const extraColor = hexToRgb(rootStyles.getPropertyValue("--color-extra"));
    const videoHighlightColor = { r: 0, g: 0, b: 0 };
    const graphiteColor = { r: 14, g: 16, b: 18 };
    const graphiteAccentColor = { r: 22, g: 24, b: 28 };
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastFrameTime = 0;
    let z = Math.random() * 222;
    const speed = mode === "reduced" ? 0.18 : 1.85;
    const scale = 0.0028;
    let spacing = 14;
    const frameInterval = 1000 / (mode === "reduced" ? 12 : 24);
    let gridPoints: Array<{ x: number; y: number }> = [];
    const pointer = {
      x: 0,
      y: 0,
      currentX: 0,
      currentY: 0,
      previousX: 0,
      previousY: 0,
      velocityX: 0,
      velocityY: 0,
      active: false,
      strength: 0,
      targetStrength: 0,
      flowX: 1,
      flowY: 0,
      wake: 0,
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      spacing =
        mode === "reduced"
          ? width < 640
            ? 28
            : width < 1024
              ? 24
              : 22
          : width < 640
            ? 20
            : width < 1024
              ? 17
              : 15;
      gridPoints = [];

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          gridPoints.push({ x, y });
        }
      }

      if (!pointer.active) {
        pointer.x = width * 0.5;
        pointer.y = height * 0.5;
        pointer.currentX = pointer.x;
        pointer.currentY = pointer.y;
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!pointer.active) {
        pointer.currentX = pointer.x;
        pointer.currentY = pointer.y;
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
      }

      pointer.active = true;
      pointer.targetStrength = mode === "reduced" ? 0.45 : 1;
    };

    const handlePointerLeave = () => {
      pointer.x = width * 0.5;
      pointer.y = height * 0.5;
      pointer.targetStrength = 0;
    };

    const handleVideoRevealProgress = (event: Event) => {
      const customEvent = event as CustomEvent<{ progress?: number }>;
      videoRevealProgressRef.current = clamp01(customEvent.detail?.progress ?? 0);
    };

    const render = (timestamp: number) => {
      if (timestamp - lastFrameTime < frameInterval) {
        animationFrame = window.requestAnimationFrame(render);
        return;
      }

      lastFrameTime = timestamp;
      context.clearRect(0, 0, width, height);

      const pointerLerp = mode === "reduced" ? 0.12 : 0.18;
      pointer.currentX = lerp(pointer.currentX, pointer.x, pointerLerp);
      pointer.currentY = lerp(pointer.currentY, pointer.y, pointerLerp);
      pointer.velocityX = lerp(pointer.velocityX, pointer.currentX - pointer.previousX, mode === "reduced" ? 0.12 : 0.2);
      pointer.velocityY = lerp(pointer.velocityY, pointer.currentY - pointer.previousY, mode === "reduced" ? 0.12 : 0.2);
      pointer.previousX = pointer.currentX;
      pointer.previousY = pointer.currentY;
      pointer.strength = lerp(pointer.strength, pointer.targetStrength, mode === "reduced" ? 0.06 : 0.1);

      const velocityMagnitude = Math.hypot(pointer.velocityX, pointer.velocityY);

      if (velocityMagnitude > 0.01) {
        const targetFlowX = pointer.velocityX / velocityMagnitude;
        const targetFlowY = pointer.velocityY / velocityMagnitude;
        pointer.flowX = lerp(pointer.flowX, targetFlowX, 0.16);
        pointer.flowY = lerp(pointer.flowY, targetFlowY, 0.16);
      }

      const flowMagnitude = Math.hypot(pointer.flowX, pointer.flowY) || 1;
      const directionX = pointer.flowX / flowMagnitude;
      const directionY = pointer.flowY / flowMagnitude;
      const normalX = -directionY;
      const normalY = directionX;
      const hasWake = pointer.strength > 0.001 || pointer.wake > 0.001;
      const wakeRadius = hasWake ? Math.min(width, height) * (mode === "reduced" ? 0.11 : 0.16) : 0;
      const wakeRadiusSquared = wakeRadius * wakeRadius;
      const trailLength = wakeRadius * (mode === "reduced" ? 1.2 : 2.2);
      const wakeTarget = pointer.strength * Math.min(1, 0.16 + velocityMagnitude * (mode === "reduced" ? 1.2 : 2.1));
      pointer.wake = lerp(pointer.wake, wakeTarget, mode === "reduced" ? 0.04 : 0.08);
      const backdropStyles = backdropRef.current ? getComputedStyle(backdropRef.current) : null;
      const topBackgroundColor = {
        r: backdropStyles ? getCssNumber(backdropStyles, "--noise-top-r", 6) : 6,
        g: backdropStyles ? getCssNumber(backdropStyles, "--noise-top-g", 35) : 35,
        b: backdropStyles ? getCssNumber(backdropStyles, "--noise-top-b", 67) : 67,
      };
      const bottomBackgroundColor = {
        r: backdropStyles ? getCssNumber(backdropStyles, "--noise-bottom-r", 12) : 12,
        g: backdropStyles ? getCssNumber(backdropStyles, "--noise-bottom-g", 40) : 40,
        b: backdropStyles ? getCssNumber(backdropStyles, "--noise-bottom-b", 68) : 68,
      };
      const fadeToBlack = backdropStyles ? clamp01(getCssNumber(backdropStyles, "--noise-darkness", 0)) : 0;
      const videoRevealProgress = videoRevealProgressRef.current;

      for (const point of gridPoints) {
        const { x, y } = point;
        let sampleX = x;
        let sampleY = y;

        if (hasWake && pointer.wake > 0.001 && mode !== "reduced") {
          const offsetX = x - pointer.currentX;
          const offsetY = y - pointer.currentY;
          const distanceSquared = offsetX * offsetX + offsetY * offsetY;

          if (distanceSquared < wakeRadiusSquared * 4.2) {
            const forward = offsetX * directionX + offsetY * directionY;
            const sideways = offsetX * normalX + offsetY * normalY;
            const radialDistance = Math.sqrt(distanceSquared);
            const radialFalloff = Math.max(0, 1 - radialDistance / (wakeRadius * 2.05));
            const sideFalloff = Math.max(0, 1 - Math.abs(sideways) / wakeRadius);
            const tailFalloff = Math.max(0, 1 - Math.max(-forward, 0) / trailLength);
            const streamStrength = radialFalloff * sideFalloff * tailFalloff * pointer.wake;

            sampleX = x - directionX * streamStrength * 8 - normalX * sideways * streamStrength * 0.03;
            sampleY = y - directionY * streamStrength * 8 - normalY * sideways * streamStrength * 0.03;
          }
        }

        const horizontalPhase = width > 0 ? x / width : 0;
        const verticalPhase = height > 0 ? y / height : 0;
        const waveCenter = videoRevealProgress * 1.45 - 0.18;
        const wavePosition = horizontalPhase * 0.82 + verticalPhase * 0.26;
        const waveMix = smoothstep(-0.16, 0.18, waveCenter - wavePosition);
        const ripplePhase = (horizontalPhase * 8.4 - verticalPhase * 5.6 + z * 0.008) * Math.PI;
        const ripple = Math.sin(ripplePhase);
        const waveDisplacement = waveMix * ripple;
        const value = getValue(sampleX + waveDisplacement * 22, sampleY + waveDisplacement * 34, z, scale);
        const radius = Math.abs(2 * value);

        if (radius < 0.52) {
          continue;
        }

        const intensity = Math.min(Math.abs(value), 1);
        const accentBlend = Math.min(1, intensity * 1.08);
        const extraBlend = Math.max(0, (intensity - 0.52) / 0.48);
        const alpha = mode === "reduced" ? 0.32 + intensity * 0.12 : 0.4 + intensity * 0.18;
        const verticalMix = height > 0 ? clamp01(y / height) : 0;
        const backgroundR = mixChannel(
          mixChannel(topBackgroundColor.r, bottomBackgroundColor.r, verticalMix),
          0,
          fadeToBlack,
        );
        const backgroundG = mixChannel(
          mixChannel(topBackgroundColor.g, bottomBackgroundColor.g, verticalMix),
          0,
          fadeToBlack,
        );
        const backgroundB = mixChannel(
          mixChannel(topBackgroundColor.b, bottomBackgroundColor.b, verticalMix),
          0,
          fadeToBlack,
        );
        const adaptiveNeutral = getAdaptiveNeutral(getLuminance(backgroundR, backgroundG, backgroundB));
        const baseR = adaptiveNeutral.r;
        const baseG = adaptiveNeutral.g;
        const baseB = adaptiveNeutral.b;
        const colorShift = clamp01(waveMix * (0.72 + (ripple * 0.5 + 0.5) * 0.28));
        const accentR = mixChannel(accentColor.r, graphiteAccentColor.r, colorShift);
        const accentG = mixChannel(accentColor.g, graphiteAccentColor.g, colorShift);
        const accentB = mixChannel(accentColor.b, graphiteAccentColor.b, colorShift);
        const revealedExtraR = mixChannel(videoHighlightColor.r, graphiteColor.r, colorShift);
        const revealedExtraG = mixChannel(videoHighlightColor.g, graphiteColor.g, colorShift);
        const revealedExtraB = mixChannel(videoHighlightColor.b, graphiteColor.b, colorShift);
        const extraR = mixChannel(extraColor.r, revealedExtraR, waveMix);
        const extraG = mixChannel(extraColor.g, revealedExtraG, waveMix);
        const extraB = mixChannel(extraColor.b, revealedExtraB, waveMix);
        const drawX = x + waveDisplacement * 6;
        const drawY = y + waveDisplacement * 10;
        const r = Math.round(
          baseR * (1 - accentBlend) * (1 - extraBlend) +
            accentR * accentBlend * (1 - extraBlend) +
            extraR * extraBlend,
        );
        const g = Math.round(
          baseG * (1 - accentBlend) * (1 - extraBlend) +
            accentG * accentBlend * (1 - extraBlend) +
            extraG * extraBlend,
        );
        const b = Math.round(
          baseB * (1 - accentBlend) * (1 - extraBlend) +
            accentB * accentBlend * (1 - extraBlend) +
            extraB * extraBlend,
        );

        context.beginPath();
        context.arc(drawX, drawY, radius, 0, Math.PI * 2, true);
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        context.fill();
      }

      z += speed;
      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    seedNoise(z);
    videoRevealProgressRef.current = clamp01(
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--video-reveal-progress-global")) || 0,
    );
    animationFrame = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("skub:video-reveal-progress", handleVideoRevealProgress as EventListener);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("skub:video-reveal-progress", handleVideoRevealProgress as EventListener);
    };
  }, [mode]);

  return (
    <>
      <div ref={backdropRef} className={styles.backdrop} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </>
  );
}
