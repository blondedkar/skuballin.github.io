"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import styles from "./HeroShaderReveal.module.css";

type HeroShaderRevealProps = {
  alt: string;
  baseSrc: string;
  revealSrc: string;
};

const simplexChunk = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0)
    )
    + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;

  return 42.0 * dot(
    m * m,
    vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))
  );
}
`;

const quadVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fluidBaseVertexShader = `
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 vFluidUv;

precision highp float;

void main() {
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  vFluidUv = vec2(0.5) + (pos.xy) * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

const fluidAdvectionFragmentShader = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform float dissipation;
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 vFluidUv;

void main() {
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;

  if (isBFECC == false) {
    vec2 vel = texture2D(velocity, vFluidUv).xy;
    vec2 uv2 = vFluidUv - vel * dt * ratio;
    vec2 newVel = texture2D(velocity, uv2).xy;
    gl_FragColor = vec4(newVel, 0.0, 0.0);
  } else {
    vec2 spot_new = vFluidUv;
    vec2 vel_old = texture2D(velocity, vFluidUv).xy;
    vec2 spot_old = spot_new - vel_old * dt * ratio;
    vec2 vel_new1 = texture2D(velocity, spot_old).xy;
    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
    vec2 error = spot_new2 - spot_new;
    vec2 spot_new3 = spot_new - error / 2.0;
    vec2 vel_2 = texture2D(velocity, spot_new3).xy;
    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
    vec2 newVel2 = texture2D(velocity, spot_old2).xy * dissipation;
    gl_FragColor = vec4(newVel2, 0.0, 0.0);
  }
}
`;

const fluidForceVertexShader = `
precision highp float;

uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vForceUv;

void main() {
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vForceUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const fluidForceFragmentShader = `
precision highp float;

uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vForceUv;

void main() {
  vec2 circle = (vForceUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

const fluidDivergenceFragmentShader = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 vFluidUv;

void main() {
  float x0 = texture2D(velocity, vFluidUv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, vFluidUv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, vFluidUv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, vFluidUv + vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`;

const fluidPoissonFragmentShader = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float straightness;
uniform vec2 px;
varying vec2 vFluidUv;

void main() {
  float p0 = texture2D(pressure, vFluidUv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, vFluidUv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, vFluidUv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, vFluidUv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, vFluidUv).r;
  float newP = (p0 + p1 + p2 + p3) / (4.0 + straightness) - div;
  gl_FragColor = vec4(newP);
}
`;

const fluidPressureFragmentShader = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 vFluidUv;

void main() {
  float stepSize = 1.0;
  float p0 = texture2D(pressure, vFluidUv + vec2(px.x * stepSize, 0.0)).r;
  float p1 = texture2D(pressure, vFluidUv - vec2(px.x * stepSize, 0.0)).r;
  float p2 = texture2D(pressure, vFluidUv + vec2(0.0, px.y * stepSize)).r;
  float p3 = texture2D(pressure, vFluidUv - vec2(0.0, px.y * stepSize)).r;
  vec2 v = texture2D(velocity, vFluidUv).xy;
  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

const fluidOutputFragmentShader = `
precision highp float;
uniform sampler2D velocity;
varying vec2 vFluidUv;

void main() {
  vec2 vel = texture2D(velocity, vFluidUv).xy;
  float mask = smoothstep(0.04, 0.13, length(vel));
  gl_FragColor = vec4(vec3(mask), mask);
}
`;

const backgroundNoiseFragmentShader = `
${simplexChunk}

varying vec2 vUv;

uniform float uAspect;
uniform float uTime;
uniform float uMousePace;
uniform float uReveal;
uniform vec2 uMouseCoords;

uniform float SCALE;
uniform float SPEED;
uniform float DISTORT_SCALE;
uniform float DISTORT_INTENSITY;
uniform float NOISE_DETAIL;
uniform float CURSOR_INTENSITY;
uniform float CURSOR_SCALE;
uniform float CURSOR_BOUNCE;
uniform float REVEAL_SIZE;

void main() {
  vec2 uv = vUv;
  uv.x *= uAspect;
  uv.y += (REVEAL_SIZE + REVEAL_SIZE / 3.0) * (1.0 - uReveal);
  uv.y /= 1.0 + REVEAL_SIZE * (1.0 - uReveal);

  vec2 mouse = uMouseCoords;
  mouse *= vec2(0.5);
  mouse += vec2(0.5);
  mouse.x *= uAspect;

  float cursor = 1.0 - distance(mouse, uv) * CURSOR_SCALE;
  cursor *= uMousePace;
  cursor = clamp(cursor, CURSOR_BOUNCE, 1.0);

  float noiseDistort = 0.5 + snoise(vec3(uv.x * DISTORT_SCALE, uv.y * DISTORT_SCALE, uTime * SPEED * 0.1)) * 0.5;

  float noiseFinal = 0.5 + snoise(
    vec3(
      (uv.x + (cursor * CURSOR_INTENSITY) + (noiseDistort * DISTORT_INTENSITY)) * SCALE,
      (uv.y + (cursor * CURSOR_INTENSITY) + (noiseDistort * DISTORT_INTENSITY)) * SCALE,
      uTime * SPEED
    )
  ) * 0.5;

  noiseFinal *= NOISE_DETAIL;
  noiseFinal = fract(noiseFinal);

  float noiseBase = step(0.5, noiseFinal);
  gl_FragColor = vec4(vec3(noiseBase, noiseFinal, 0.0), 1.0);
}
`;

const compositionFragmentShader = `
uniform float uAspect;
uniform float uReveal;
uniform float uHover;
uniform float uHelmetHover;
uniform float uFilter;
uniform float uCursorIntensity;
uniform vec3 uColorHover;

uniform sampler2D tHelmet;
uniform sampler2D tCursorEffect;
uniform sampler2D tBackgroundNoise;

uniform bool OUTLINE;
uniform bool SHOW_HELMET_PERMANENTLY;
uniform float THICKNESS;
uniform vec3 COLOR_OUTLINE;
uniform vec3 COLOR_FOREGROUND;
uniform vec3 COLOR_BACKGROUND;
uniform vec3 COLOR_CURSOR_FOREGROUND;
uniform vec3 COLOR_CURSOR_BACKGROUND;
uniform vec3 COLOR_CURSOR_OUTLINE;
uniform vec3 COLOR_FILTER;

varying vec2 vUv;

float localLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 localToGrayscale(vec3 color) {
  float gray = localLuminance(color);
  return vec3(gray);
}

vec3 localAdjustContrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

float blendHardLightChannel(float base, float blend) {
  return blend < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

vec3 blendHardLight(vec3 base, vec3 blend) {
  return vec3(
    blendHardLightChannel(base.r, blend.r),
    blendHardLightChannel(base.g, blend.g),
    blendHardLightChannel(base.b, blend.b)
  );
}

void main() {
  vec4 textureBackgroundNoise = texture2D(tBackgroundNoise, vUv);
  vec4 textureCursorEffect = texture2D(tCursorEffect, vec2(0.025 + vUv.x * 0.95, 0.025 + vUv.y * 0.95));
  textureCursorEffect.rgb = 1.0 - textureCursorEffect.rgb;

  float cursorEffect = smoothstep(0.08, 0.36, textureCursorEffect.r);
  float noiseBase = textureBackgroundNoise.r;

  vec3 background = mix(
    COLOR_BACKGROUND,
    mix(COLOR_BACKGROUND, COLOR_FOREGROUND, uReveal),
    noiseBase
  );

  vec3 cursorBackground = mix(COLOR_CURSOR_BACKGROUND, COLOR_CURSOR_FOREGROUND, noiseBase);

  if (OUTLINE) {
    float edge = 0.0;

    vec4 sampledRight = texture2D(tBackgroundNoise, vUv + vec2(THICKNESS, 0.0));
    vec4 sampledLeft = texture2D(tBackgroundNoise, vUv + vec2(-THICKNESS, 0.0));
    vec4 sampledUp = texture2D(tBackgroundNoise, vUv + vec2(0.0, THICKNESS));
    vec4 sampledDown = texture2D(tBackgroundNoise, vUv + vec2(0.0, -THICKNESS));

    if (
      sampledRight.r != textureBackgroundNoise.r ||
      sampledLeft.r != textureBackgroundNoise.r ||
      sampledUp.r != textureBackgroundNoise.r ||
      sampledDown.r != textureBackgroundNoise.r
    ) {
      edge = 1.0;
    }

    background = mix(
      COLOR_BACKGROUND,
      mix(COLOR_BACKGROUND, COLOR_OUTLINE, uReveal),
      edge
    );

    cursorBackground = mix(cursorBackground, COLOR_CURSOR_OUTLINE, edge);
  }

  background = mix(
    background,
    uColorHover,
    step(textureBackgroundNoise.g, -0.1 + uHover * 1.1)
  );

  background = mix(
    background,
    cursorBackground,
    cursorEffect * uCursorIntensity
  );

  vec4 textureHelmet = texture2D(tHelmet, vUv);

  float hoverTransition = vUv.y + sin(vUv.x * 3.141592653589793) * sin(uHelmetHover * 3.141592653589793) * 0.2;

  cursorEffect += step(1.0 - hoverTransition, uHelmetHover);
  cursorEffect = clamp(cursorEffect * uCursorIntensity, 0.0, 1.0);

  background = mix(background, cursorBackground, step(1.0 - hoverTransition, uHelmetHover));

  float revealAlpha = cursorEffect * textureHelmet.a;

  if (SHOW_HELMET_PERMANENTLY) {
    revealAlpha = textureHelmet.a;
  }

  float finalAlpha = clamp(revealAlpha, 0.0, 1.0);
  vec3 revealColor = textureHelmet.rgb;

  gl_FragColor = vec4(revealColor, finalAlpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function HeroShaderReveal({
  alt,
  baseSrc,
  revealSrc,
}: HeroShaderRevealProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const revealImageRef = useRef<HTMLImageElement | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const revealLayer = revealImageRef.current;

    if (!host || !revealLayer) {
      return undefined;
    }

    const glCanvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: glCanvas,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * 1.2, 2));

    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const noiseScene = new THREE.Scene();
    const compositionScene = new THREE.Scene();

    let disposed = false;
    let revealImage: HTMLImageElement | null = null;
    let isVisible = true;
    let isDocumentVisible = document.visibilityState !== "hidden";
    let lastMaskFrameTime = 0;
    let lastInteractiveTime = 0;
    let lastMaskUrl = "";

    const backgroundNoiseUniforms = {
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uMousePace: { value: 0.06 },
      uReveal: { value: 1 },
      uMouseCoords: { value: new THREE.Vector2(0, 0) },
      SCALE: { value: 19.5 },
      SPEED: { value: 0.24 },
      DISTORT_SCALE: { value: 10.0 },
      DISTORT_INTENSITY: { value: 0.09 },
      NOISE_DETAIL: { value: 2.35 },
      CURSOR_INTENSITY: { value: 0.28 },
      CURSOR_SCALE: { value: 4.9 },
      CURSOR_BOUNCE: { value: 0.06 },
      REVEAL_SIZE: { value: 0.18 },
    };

    const noiseMaterial = new THREE.ShaderMaterial({
      uniforms: backgroundNoiseUniforms,
      vertexShader: quadVertexShader,
      fragmentShader: backgroundNoiseFragmentShader,
    });

    const compositionUniforms = {
      uAspect: { value: 1 },
      uReveal: { value: 1 },
      uHover: { value: 0 },
      uHelmetHover: { value: 0 },
      uFilter: { value: 0 },
      uCursorIntensity: { value: 1 },
      uColorHover: { value: new THREE.Color("#1c2129") },
      tHelmet: { value: null as THREE.Texture | null },
      tCursorEffect: { value: null as THREE.Texture | null },
      tBackgroundNoise: { value: null as THREE.Texture | null },
      OUTLINE: { value: false },
      SHOW_HELMET_PERMANENTLY: { value: false },
      THICKNESS: { value: 0.0035 },
      COLOR_OUTLINE: { value: new THREE.Color("#ffb38a") },
      COLOR_FOREGROUND: { value: new THREE.Color("#1a1f27") },
      COLOR_BACKGROUND: { value: new THREE.Color("#000000") },
      COLOR_CURSOR_FOREGROUND: { value: new THREE.Color("#232a35") },
      COLOR_CURSOR_BACKGROUND: { value: new THREE.Color("#000000") },
      COLOR_CURSOR_OUTLINE: { value: new THREE.Color("#ffb38a") },
      COLOR_FILTER: { value: new THREE.Color("#0a1630") },
    };

    const compositionMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: compositionUniforms,
      vertexShader: quadVertexShader,
      fragmentShader: compositionFragmentShader,
      toneMapped: false,
    });

    const noiseQuad = new THREE.Mesh(quadGeometry, noiseMaterial);
    const compositionQuad = new THREE.Mesh(quadGeometry, compositionMaterial);
    noiseScene.add(noiseQuad);
    compositionScene.add(compositionQuad);

    const fluidScene = new THREE.Scene();
    const fluidQuad = new THREE.Mesh(
      quadGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          px: { value: new THREE.Vector2(1, 1) },
          boundarySpace: { value: new THREE.Vector2(0, 0) },
          fboSize: { value: new THREE.Vector2(1, 1) },
          velocity: { value: null as THREE.Texture | null },
          dt: { value: 0.014 },
          dissipation: { value: 0.996 },
          isBFECC: { value: true },
        },
        vertexShader: fluidBaseVertexShader,
        fragmentShader: fluidAdvectionFragmentShader,
      }),
    );
    fluidScene.add(fluidQuad);

    const forceScene = new THREE.Scene();
    const forceMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        px: { value: new THREE.Vector2(1, 1) },
        force: { value: new THREE.Vector2(0, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        scale: { value: new THREE.Vector2(18, 18) },
      },
      vertexShader: fluidForceVertexShader,
      fragmentShader: fluidForceFragmentShader,
    });
    const forceQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), forceMaterial);
    forceScene.add(forceQuad);

    const divergenceScene = new THREE.Scene();
    const divergenceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        px: { value: new THREE.Vector2(1, 1) },
        boundarySpace: { value: new THREE.Vector2(0, 0) },
        velocity: { value: null as THREE.Texture | null },
        dt: { value: 0.014 },
      },
      vertexShader: fluidBaseVertexShader,
      fragmentShader: fluidDivergenceFragmentShader,
    });
    divergenceScene.add(new THREE.Mesh(quadGeometry, divergenceMaterial));

    const poissonScene = new THREE.Scene();
    const poissonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        px: { value: new THREE.Vector2(1, 1) },
        boundarySpace: { value: new THREE.Vector2(0, 0) },
        pressure: { value: null as THREE.Texture | null },
        divergence: { value: null as THREE.Texture | null },
        straightness: { value: 1 },
      },
      vertexShader: fluidBaseVertexShader,
      fragmentShader: fluidPoissonFragmentShader,
    });
    poissonScene.add(new THREE.Mesh(quadGeometry, poissonMaterial));

    const pressureScene = new THREE.Scene();
    const pressureMaterial = new THREE.ShaderMaterial({
      uniforms: {
        px: { value: new THREE.Vector2(1, 1) },
        boundarySpace: { value: new THREE.Vector2(0, 0) },
        pressure: { value: null as THREE.Texture | null },
        velocity: { value: null as THREE.Texture | null },
        dt: { value: 0.014 },
      },
      vertexShader: fluidBaseVertexShader,
      fragmentShader: fluidPressureFragmentShader,
    });
    pressureScene.add(new THREE.Mesh(quadGeometry, pressureMaterial));

    const fluidOutputScene = new THREE.Scene();
    const fluidOutputMaterial = new THREE.ShaderMaterial({
      uniforms: {
        velocity: { value: null as THREE.Texture | null },
        boundarySpace: { value: new THREE.Vector2(0, 0) },
        px: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: fluidBaseVertexShader,
      fragmentShader: fluidOutputFragmentShader,
    });
    fluidOutputScene.add(new THREE.Mesh(quadGeometry, fluidOutputMaterial));

    const noiseRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
    });

    compositionUniforms.tBackgroundNoise.value = noiseRenderTarget.texture;
    const fluidTargetOptions = {
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
    };
    const fluidVelocity0 = new THREE.WebGLRenderTarget(1, 1, fluidTargetOptions);
    const fluidVelocity1 = new THREE.WebGLRenderTarget(1, 1, fluidTargetOptions);
    const fluidDivergence = new THREE.WebGLRenderTarget(1, 1, fluidTargetOptions);
    const fluidPressure0 = new THREE.WebGLRenderTarget(1, 1, fluidTargetOptions);
    const fluidPressure1 = new THREE.WebGLRenderTarget(1, 1, fluidTargetOptions);
    const fluidDisplay = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
    });
    compositionUniforms.tCursorEffect.value = fluidDisplay.texture;

    const pointer = {
      current: new THREE.Vector2(0.5, 0.5),
      target: new THREE.Vector2(0.5, 0.5),
      previous: new THREE.Vector2(0.5, 0.5),
      hoverCurrent: 0,
      hoverTarget: 0,
      pace: 0,
      isIdleDriving: true,
      idleProgress: new THREE.Vector2(0, 0),
      idleCurrent: new THREE.Vector2(0.5, 0.5),
      idleStartedAt: performance.now(),
    };
    const impulses: Array<{ x: number; y: number; forceX: number; forceY: number }> = [];
    let frameId = 0;
    let pulseTimeout = 0;

    const scheduleIdlePulse = () => {
      pulseTimeout = window.setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = 0.32 + Math.random() * 0.22;
        impulses.push({
          x: 0.22 + Math.random() * 0.56,
          y: 0.14 + Math.random() * 0.68,
          forceX: Math.cos(angle) * magnitude,
          forceY: Math.sin(angle) * magnitude,
        });
        scheduleIdlePulse();
      }, 1800 + Math.random() * 1400);
    };

    const pushPointerImpulse = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = 0.18 + Math.random() * 0.12;
      impulses.push({
        x,
        y,
        forceX: Math.cos(angle) * magnitude,
        forceY: Math.sin(angle) * magnitude,
      });
    };

    const updateSize = () => {
      const bounds = host.getBoundingClientRect();

      if (!bounds.width || !bounds.height) {
        return;
      }

      const pixelRatio = Math.min(window.devicePixelRatio * 1.2, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(bounds.width, bounds.height, false);
      noiseRenderTarget.setSize(
        Math.max(1, Math.round(bounds.width * pixelRatio)),
        Math.max(1, Math.round(bounds.height * pixelRatio)),
      );
      const fluidWidth = THREE.MathUtils.clamp(
        Math.round(bounds.width * Math.min(pixelRatio, 1.35)),
        320,
        960,
      );
      const fluidHeight = THREE.MathUtils.clamp(
        Math.round(bounds.height * Math.min(pixelRatio, 1.35)),
        320,
        960,
      );
      for (const target of [fluidVelocity0, fluidVelocity1, fluidDivergence, fluidPressure0, fluidPressure1, fluidDisplay]) {
        target.setSize(fluidWidth, fluidHeight);
      }
      const cellScaleX = 1 / fluidWidth;
      const cellScaleY = 1 / fluidHeight;
      const fboSize = new THREE.Vector2(fluidWidth, fluidHeight);
      const px = new THREE.Vector2(
        cellScaleX * (fluidWidth / (1100 * 0.1)),
        cellScaleY * (fluidWidth / (1100 * 0.1)),
      );
      for (const uniformVector of [
        fluidQuad.material.uniforms.px.value,
        fluidQuad.material.uniforms.boundarySpace.value,
        forceMaterial.uniforms.px.value,
        divergenceMaterial.uniforms.px.value,
        divergenceMaterial.uniforms.boundarySpace.value,
        poissonMaterial.uniforms.px.value,
        poissonMaterial.uniforms.boundarySpace.value,
        pressureMaterial.uniforms.px.value,
        pressureMaterial.uniforms.boundarySpace.value,
        fluidOutputMaterial.uniforms.px.value,
        fluidOutputMaterial.uniforms.boundarySpace.value,
      ]) {
        uniformVector.set(px.x, px.y);
      }
      fluidQuad.material.uniforms.fboSize.value.copy(fboSize);
      compositionUniforms.uAspect.value = bounds.width / bounds.height;
      backgroundNoiseUniforms.uAspect.value = bounds.width / bounds.height;
    };

    const normalizePointer = (clientX: number, clientY: number) => {
      const bounds = host.getBoundingClientRect();

      return {
        x: THREE.MathUtils.clamp((clientX - bounds.left) / bounds.width, 0, 1),
        y: THREE.MathUtils.clamp((clientY - bounds.top) / bounds.height, 0, 1),
      };
    };

    const handlePointerEnter = (event: PointerEvent) => {
      pointer.hoverTarget = 1;
      pointer.isIdleDriving = false;
      lastInteractiveTime = performance.now();
      const normalized = normalizePointer(event.clientX, event.clientY);
      pointer.target.set(normalized.x, normalized.y);
      pushPointerImpulse(normalized.x, normalized.y);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.hoverTarget = 1;
      pointer.isIdleDriving = false;
      lastInteractiveTime = performance.now();
      const normalized = normalizePointer(event.clientX, event.clientY);
      pointer.target.set(normalized.x, normalized.y);
    };

    const handlePointerLeave = () => {
      pointer.hoverTarget = 0;
      pointer.isIdleDriving = true;
      pointer.idleStartedAt = performance.now();
      lastInteractiveTime = performance.now();
    };

    const handleVisibilityChange = () => {
      isDocumentVisible = document.visibilityState !== "hidden";
    };

    const resizeObserver = new ResizeObserver(updateSize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.01 },
    );
    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    host.addEventListener("pointerenter", handlePointerEnter);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const renderSceneToTarget = (
      sceneToRender: THREE.Scene,
      target: THREE.WebGLRenderTarget,
      clear = true,
    ) => {
      renderer.setRenderTarget(target);
      const previousAutoClear = renderer.autoClear;
      renderer.autoClear = clear;
      renderer.render(sceneToRender, quadCamera);
      renderer.autoClear = previousAutoClear;
      renderer.setRenderTarget(null);
    };

    const splatForce = (x: number, y: number, forceX: number, forceY: number) => {
      const sizeX = fluidVelocity0.width;
      const sizeY = fluidVelocity0.height;
      const px = forceMaterial.uniforms.px.value as THREE.Vector2;
      const cursorSize = 18;
      const scaleX = cursorSize;
      const scaleY = cursorSize;
      const spanX = cursorSize * px.x;
      const spanY = cursorSize * px.y;
      const centerX = THREE.MathUtils.clamp(x * 2 - 1, -1 + spanX + px.x * 2, 1 - spanX - px.x * 2);
      const centerY = THREE.MathUtils.clamp((1 - y) * 2 - 1, -1 + spanY + px.y * 2, 1 - spanY - px.y * 2);

      forceMaterial.uniforms.center.value.set(centerX, centerY);
      forceMaterial.uniforms.scale.value.set(scaleX, scaleY);
      forceMaterial.uniforms.force.value.set(forceX, -forceY);

      renderSceneToTarget(forceScene, fluidVelocity1, false);
    };

    const updateFluidCursor = (now: number) => {
      fluidQuad.material.uniforms.velocity.value = fluidVelocity0.texture;
      renderSceneToTarget(fluidScene, fluidVelocity1);

      const diffX = pointer.current.x - pointer.previous.x;
      const diffY = pointer.current.y - pointer.previous.y;
      const moveForce = pointer.isIdleDriving ? 88 : 52;
      const primaryForceX = diffX * moveForce;
      const primaryForceY = diffY * moveForce;

      const shouldDriveFluid =
        pointer.hoverCurrent > 0.001 ||
        pointer.isIdleDriving ||
        Math.abs(primaryForceX) > 0.0001 ||
        Math.abs(primaryForceY) > 0.0001;

      if (shouldDriveFluid && (Math.abs(primaryForceX) > 0.00002 || Math.abs(primaryForceY) > 0.00002)) {
        splatForce(pointer.current.x, pointer.current.y, primaryForceX, primaryForceY);
      }

      if (
        !pointer.isIdleDriving &&
        pointer.hoverCurrent > 0.08 &&
        Math.abs(primaryForceX) <= 0.00002 &&
        Math.abs(primaryForceY) <= 0.00002
      ) {
        const hoverHold = 0.65 + pointer.hoverCurrent * 0.45;
        splatForce(
          pointer.current.x,
          pointer.current.y,
          Math.cos(now * 0.0042) * hoverHold,
          Math.sin(now * 0.0036) * hoverHold,
        );
      }

      while (impulses.length > 0) {
        const impulse = impulses.shift();
        if (!impulse) {
          break;
        }
        const forceX = impulse.forceX === 0 && impulse.forceY === 0 ? primaryForceX : impulse.forceX;
        const forceY = impulse.forceX === 0 && impulse.forceY === 0 ? primaryForceY : impulse.forceY;
        splatForce(impulse.x, impulse.y, forceX, forceY);
      }

      divergenceMaterial.uniforms.velocity.value = fluidVelocity1.texture;
      renderSceneToTarget(divergenceScene, fluidDivergence);

      let pressureRead = fluidPressure0;
      let pressureWrite = fluidPressure1;
      poissonMaterial.uniforms.divergence.value = fluidDivergence.texture;

      for (let iteration = 0; iteration < 2; iteration += 1) {
        poissonMaterial.uniforms.pressure.value = pressureRead.texture;
        renderSceneToTarget(poissonScene, pressureWrite);
        const swap = pressureRead;
        pressureRead = pressureWrite;
        pressureWrite = swap;
      }

      pressureMaterial.uniforms.velocity.value = fluidVelocity1.texture;
      pressureMaterial.uniforms.pressure.value = pressureRead.texture;
      renderSceneToTarget(pressureScene, fluidVelocity0);

      fluidOutputMaterial.uniforms.velocity.value = fluidVelocity0.texture;
      renderSceneToTarget(fluidOutputScene, fluidDisplay);
    };

    updateSize();
    scheduleIdlePulse();

    const handleRevealLoad = () => {
      if (disposed) {
        return;
      }

      revealImage = revealLayer;
      revealLayer.style.webkitMaskSize = "100% 100%";
      revealLayer.style.maskSize = "100% 100%";
      revealLayer.style.webkitMaskRepeat = "no-repeat";
      revealLayer.style.maskRepeat = "no-repeat";
      revealLayer.style.webkitMaskPosition = "center";
      revealLayer.style.maskPosition = "center";
      setWebglReady(true);
    };

    if (revealLayer.complete) {
      handleRevealLoad();
    } else {
      revealLayer.addEventListener("load", handleRevealLoad);
    }

    const render = (now: number) => {
      if (!revealImage) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      if (!isVisible || !isDocumentVisible) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      if (pointer.isIdleDriving) {
        const idleElapsed = (now - pointer.idleStartedAt) * 0.001;
        pointer.idleProgress.x = (idleElapsed % 6) / 6;
        pointer.idleProgress.y = (idleElapsed % 9) / 9;
        pointer.idleCurrent.x =
          0.5 +
          Math.sin(idleElapsed * 0.95) * 0.16 +
          Math.sin(idleElapsed * 1.9) * 0.06;
        pointer.idleCurrent.y =
          0.5 +
          Math.cos(idleElapsed * 0.62) * 0.13 +
          Math.sin(idleElapsed * 1.35) * 0.05;
        pointer.idleCurrent.x = THREE.MathUtils.clamp(pointer.idleCurrent.x, 0.2, 0.8);
        pointer.idleCurrent.y = THREE.MathUtils.clamp(pointer.idleCurrent.y, 0.2, 0.8);
        pointer.target.lerp(pointer.idleCurrent, 0.32);
      }

      pointer.current.lerp(pointer.target, pointer.isIdleDriving ? 0.18 : 0.12);
      const velocity = pointer.current.distanceTo(pointer.previous);
      pointer.pace = THREE.MathUtils.lerp(pointer.pace, velocity * (pointer.isIdleDriving ? 58 : 30), 0.2);
      pointer.hoverCurrent = THREE.MathUtils.lerp(
        pointer.hoverCurrent,
        pointer.hoverTarget,
        pointer.hoverTarget > pointer.hoverCurrent ? 0.14 : 0.004,
      );

      backgroundNoiseUniforms.uTime.value = now * 0.001;
      backgroundNoiseUniforms.uMouseCoords.value.set(
        pointer.current.x * 2 - 1,
        (1 - pointer.current.y) * 2 - 1,
      );
      backgroundNoiseUniforms.uMousePace.value = Math.max(
        pointer.hoverCurrent > 0.001 ? 0.06 : 0.38,
        pointer.pace,
      );

      updateFluidCursor(now);
      renderer.setRenderTarget(null);
      renderer.render(fluidOutputScene, quadCamera);

      const isHovering = pointer.hoverCurrent > 0.08;
      const isRecentlyInteractive = now - lastInteractiveTime < 220;
      const shouldUpdateMask =
        isHovering ||
        isRecentlyInteractive ||
        now - lastMaskFrameTime > 1000 / 18;

      if (shouldUpdateMask) {
        lastMaskFrameTime = now;
        const maskUrl = `url("${glCanvas.toDataURL("image/png")}")`;

        if (maskUrl !== lastMaskUrl) {
          revealLayer.style.webkitMaskImage = maskUrl;
          revealLayer.style.maskImage = maskUrl;
          lastMaskUrl = maskUrl;
        }
      }

      pointer.previous.copy(pointer.current);

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(pulseTimeout);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      revealLayer.removeEventListener("load", handleRevealLoad);
      revealLayer.style.webkitMaskImage = "";
      revealLayer.style.maskImage = "";
      host.removeEventListener("pointerenter", handlePointerEnter);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      quadGeometry.dispose();
      noiseMaterial.dispose();
      compositionMaterial.dispose();
      (fluidQuad.material as THREE.ShaderMaterial).dispose();
      forceMaterial.dispose();
      divergenceMaterial.dispose();
      poissonMaterial.dispose();
      pressureMaterial.dispose();
      fluidOutputMaterial.dispose();
      forceQuad.geometry.dispose();
      noiseRenderTarget.dispose();
      fluidVelocity0.dispose();
      fluidVelocity1.dispose();
      fluidDivergence.dispose();
      fluidPressure0.dispose();
      fluidPressure1.dispose();
      fluidDisplay.dispose();
      renderer.dispose();
    };
  }, [revealSrc]);

  return (
    <div ref={hostRef} className={styles.root}>
      <img src={baseSrc} alt={alt} className={styles.baseImage} />
      <img
        ref={revealImageRef}
        src={revealSrc}
        alt=""
        className={`${styles.revealImage} ${webglReady ? styles.revealReady : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}
