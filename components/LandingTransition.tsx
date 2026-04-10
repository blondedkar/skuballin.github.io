"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import styles from "./LandingTransition.module.css";

const SVG_PATH =
  "m148.45 51.94c-41.43 40.67-73.06 87.38-73.06 109.22 0 5.27-9.8 16.57-22.6 24.86-12.05 8.28-26.37 24.86-31.64 36.91-19.58 47.45 42.94 107.72 116.76 111.48 54.23 3.02 37.66 16.57-26.37 21.09-62.52 4.52-92.65 18.84-103.95 49.72-11.3 29.38-9.04 39.92 14.31 64.03 19.59 18.83 27.87 21.84 64.03 21.84 26.37 0 60.26-6.78 92.65-18.83 27.87-10.55 54.24-18.08 58.01-15.82 4.52 1.51 25.61 9.79 45.94 18.08l38.42 15.07 46.7-28.63c58.01-34.65 85.88-58.75 111.49-97.17 26.36-39.92 26.36-88.89 0.75-127.3-22.6-34.65-85.12-67.8-139.35-74.58-21.85-2.26-39.17-6.78-39.17-10.54 0-3.02 13.56-31.64 30.88-62.52 16.57-31.64 27.12-57.25 22.6-57.25-3.77 0-10.55 6.02-14.31 12.8-6.78 11.3-13.56 10.55-74.58-11.3-36.15-13.55-68.54-24.1-70.05-24.1-2.26 0-23.35 19.59-47.46 42.94zm110.73 47.45c37.67 19.59 40.68 25.61 21.1 50.47-11.3 14.31-21.1 16.57-70.81 18.08-67.04 1.51-81.36-6.03-81.36-42.94 0-50.47 58.01-61.76 131.07-25.61zm-126.55 135.59c14.32 5.27 41.43 7.53 60.27 6.03 33.89-2.26 36.15-0.76 28.62 19.58-6.78 18.83-97.17 16.57-128.81-2.26-27.12-16.57-37.66-41.43-24.86-57.25 8.29-9.79 11.3-8.28 23.35 6.78 8.29 10.55 26.37 22.6 41.43 27.12zm246.32 10.55c61.77 25.61 83.62 91.9 47.46 144.62-27.12 40.68-43.69 49.72-71.56 39.93-28.63-9.79-29.38-16.57-2.26-29.38 33.14-16.57 61.77-46.7 61.77-64.78 0-24.11-26.37-53.48-57.25-63.28-15.07-5.27-47.46-7.53-71.56-6.02-45.2 3.01-54.99-3.01-35.41-22.6 12.06-12.05 98.68-11.3 128.81 1.51zm-32.39 105.45c0 19.59-35.4 59.51-48.21 54.99-4.52-1.5-30.88-10.54-58.75-19.58-84.37-27.87-64.78-52.73 41.43-53.48 64.03 0 65.53 0.75 65.53 18.07zm-181.54 84.37c21.1 6.03 36.92 14.31 34.66 18.08-6.78 11.3-73.83 30.13-106.97 30.13-57.25 0-80.6-26.36-49.71-56.5 14.31-14.31 54.98-12.05 122.02 8.29z";

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });

const withTimeout = async (promise: Promise<void>, duration: number) => {
  await Promise.race([promise, wait(duration)]);
};

const waitForWindowLoad = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }

    const handleLoad = () => {
      window.removeEventListener("load", handleLoad);
      resolve();
    };

    window.addEventListener("load", handleLoad, { once: true });
  });

const waitForFonts = async () => {
  if (!("fonts" in document)) {
    return;
  }

  await document.fonts.ready;
};

const waitForMedia = async (root: HTMLElement | null) => {
  if (!root) {
    return;
  }

  const mediaNodes = Array.from(
    root.querySelectorAll('img, video:not([data-intro-ignore="true"])'),
  );

  await Promise.all(
    mediaNodes.map(
      (node) =>
        new Promise<void>((resolve) => {
          if (node instanceof HTMLImageElement) {
            if (node.complete && node.naturalWidth > 0) {
              resolve();
              return;
            }

            const done = () => {
              node.removeEventListener("load", done);
              node.removeEventListener("error", done);
              resolve();
            };

            node.addEventListener("load", done, { once: true });
            node.addEventListener("error", done, { once: true });
            return;
          }

          if (node instanceof HTMLVideoElement) {
            if (node.readyState >= 2) {
              resolve();
              return;
            }

            const done = () => {
              node.removeEventListener("loadeddata", done);
              node.removeEventListener("error", done);
              resolve();
            };

            node.addEventListener("loadeddata", done, { once: true });
            node.addEventListener("error", done, { once: true });
            return;
          }

          resolve();
        }),
    ),
  );
};

const waitForPageAssets = async (root: HTMLElement | null) => {
  await Promise.all([
    withTimeout(waitForWindowLoad(), 2500),
    withTimeout(waitForFonts(), 2500),
    withTimeout(waitForMedia(root), 3500),
  ]);
};

const getViewportSignature = () => {
  const width = window.innerWidth;
  const breakpoint =
    width <= 640 ? "mobile" : width <= 1024 ? "tablet" : "desktop";
  const orientation =
    window.innerWidth > window.innerHeight ? "landscape" : "portrait";

  return `${breakpoint}-${orientation}`;
};

type Phase = "loading" | "revealing" | "done";

export function LandingTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("loading");
  const [drawVisible, setDrawVisible] = useState(false);
  const [fillVisible, setFillVisible] = useState(false);
  const [sequenceKey, setSequenceKey] = useState(0);
  const viewportSignatureRef = useRef<string | null>(null);
  const hasMountedRef = useRef(false);
  const pageShellRef = useRef<HTMLDivElement>(null);
  const maskId = useId().replace(/:/g, "");

  useEffect(() => {
    const currentSignature = getViewportSignature();

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      viewportSignatureRef.current = currentSignature;
      return;
    }

    viewportSignatureRef.current = currentSignature;
    setSequenceKey((value) => value + 1);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      const nextSignature = getViewportSignature();

      if (nextSignature === viewportSignatureRef.current) {
        return;
      }

      viewportSignatureRef.current = nextSignature;
      setSequenceKey((value) => value + 1);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousTransitionLock = document.body.dataset.transitionLock;
    let cancelled = false;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.dataset.transitionLock = "true";
    setPhase("loading");
    setDrawVisible(false);
    setFillVisible(false);

    const cleanup = () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;

      if (previousTransitionLock) {
        document.body.dataset.transitionLock = previousTransitionLock;
      } else {
        delete document.body.dataset.transitionLock;
      }
    };

    const runSequence = async () => {
      await Promise.all([
        waitForPageAssets(pageShellRef.current),
        wait(300),
      ]);

      if (cancelled) {
        return;
      }

      setDrawVisible(true);

      await wait(1320);

      if (cancelled) {
        return;
      }

      setFillVisible(true);

      await wait(260);

      if (cancelled) {
        return;
      }

      setPhase("revealing");

      await wait(1050);

      if (cancelled) {
        return;
      }

      setPhase("done");
      cleanup();
    };

    void runSequence();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [sequenceKey]);

  const isLoading = phase === "loading";
  const isRevealing = phase === "revealing";

  return (
    <div className={styles.scene}>
      {phase !== "done" ? (
        <div
          key={sequenceKey}
          className={`${styles.overlay} ${isRevealing ? styles.overlayRevealing : ""}`}
          aria-hidden="true"
        >
          <svg
            className={styles.maskStage}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="white" />
                <foreignObject width="100" height="100" className={styles.portalObject}>
                  <div className={styles.portalCenter}>
                    <svg
                      viewBox="0 0 500 500"
                      preserveAspectRatio="xMidYMid meet"
                      className={`${styles.portalSvg} ${isRevealing ? styles.portalSvgVisible : ""}`}
                    >
                      <path d={SVG_PATH} className={styles.portalCutout} />
                    </svg>
                  </div>
                </foreignObject>
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              className={styles.maskFill}
              mask={`url(#${maskId})`}
            />
          </svg>

          <div className={styles.markStage}>
            <svg viewBox="0 0 500 500" className={styles.markSvg}>
              <path
                d={SVG_PATH}
                className={`${styles.fillPath} ${fillVisible ? styles.fillPathVisible : ""}`}
              />
              <path
                d={SVG_PATH}
                pathLength={1}
                className={`${styles.strokePath} ${drawVisible ? styles.strokePathVisible : ""}`}
              />
            </svg>
          </div>
        </div>
      ) : null}

      <div
        ref={pageShellRef}
        className={`${styles.pageShell} ${phase !== "loading" ? styles.pageShellVisible : ""} ${isRevealing ? styles.pageShellRevealing : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
