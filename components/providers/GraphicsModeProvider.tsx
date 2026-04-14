"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GraphicsMode = "full" | "reduced";

type GraphicsModeContextValue = {
  mode: GraphicsMode;
  renderer: string;
};

const GraphicsModeContext = createContext<GraphicsModeContextValue>({
  mode: "full",
  renderer: "",
});

const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|software|microsoft basic render|angle \(.*swiftshader|mesa offscreen|softpipe/i;
const INTEGRATED_RENDERER_PATTERN = /intel|uhd|iris|radeon graphics|vega/i;

type NavigatorWithHints = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
  deviceMemory?: number;
};

const getRendererInfo = () => {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!context) {
      return { supported: false, renderer: "webgl-unavailable" };
    }

    const gl = context as WebGLRenderingContext;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

    return {
      supported: true,
      renderer: typeof renderer === "string" ? renderer : "unknown-renderer",
    };
  } catch {
    return { supported: false, renderer: "webgl-error" };
  }
};

const getInitialMode = (): GraphicsModeContextValue => {
  const browserNavigator = navigator as NavigatorWithHints;
  const rendererInfo = getRendererInfo();
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = browserNavigator.connection;
  const deviceMemory = browserNavigator.deviceMemory ?? 0;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 0;
  const renderer = rendererInfo.renderer;
  const isSoftwareRenderer = SOFTWARE_RENDERER_PATTERN.test(renderer);
  const isIntegratedRenderer = INTEGRATED_RENDERER_PATTERN.test(renderer);
  const prefersReducedMotion = motionQuery.matches;
  const prefersDataSaving = Boolean(connection?.saveData);
  const veryLowPowerDevice =
    (deviceMemory > 0 && deviceMemory <= 4) ||
    (hardwareConcurrency > 0 && hardwareConcurrency <= 4);
  const constrainedDevice = isIntegratedRenderer && veryLowPowerDevice;

  return {
    mode:
      !rendererInfo.supported ||
      isSoftwareRenderer ||
      prefersReducedMotion ||
      prefersDataSaving ||
      constrainedDevice
        ? "reduced"
        : "full",
    renderer,
  };
};

export function GraphicsModeProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<GraphicsModeContextValue>({
    mode: "full",
    renderer: "",
  });

  useEffect(() => {
    const update = () => {
      setValue(getInitialMode());
    };

    update();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => {
      update();
    };

    motionQuery.addEventListener("change", handleChange);

    return () => {
      motionQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.graphicsMode = value.mode;

    if (value.renderer) {
      document.documentElement.dataset.graphicsRenderer = value.renderer
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    } else {
      delete document.documentElement.dataset.graphicsRenderer;
    }

    return () => {
      delete document.documentElement.dataset.graphicsMode;
      delete document.documentElement.dataset.graphicsRenderer;
    };
  }, [value]);

  const contextValue = useMemo(() => value, [value]);

  return (
    <GraphicsModeContext.Provider value={contextValue}>
      {children}
    </GraphicsModeContext.Provider>
  );
}

export const useGraphicsMode = () => useContext(GraphicsModeContext);
