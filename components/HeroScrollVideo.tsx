"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./HeroScrollVideo.module.css";

type HeroScrollVideoProps = {
  src: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function HeroScrollVideo({ src }: HeroScrollVideoProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;

    if (!host || !video) {
      return undefined;
    }

    let frameId = 0;
    let disposed = false;
    let isVisible = true;
    let isDocumentVisible = document.visibilityState !== "hidden";
    let duration = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    const updateVideoState = () => {
      const style = getComputedStyle(host);
      const panelProgress = Number.parseFloat(style.getPropertyValue("--panel-progress")) || 0;
      const exitProgress = clamp((panelProgress - 0.34) * 1.65, 0, 1);
      const revealProgress = smoothstep(0.14, 0.9, exitProgress);
      targetProgress = revealProgress;
      currentProgress += (targetProgress - currentProgress) * 0.42;

      const opacityProgress = smoothstep(0.02, 0.44, currentProgress);
      video.style.opacity = opacityProgress.toFixed(3);

      if (duration > 0) {
        const nextTime = currentProgress * duration;

        if (Math.abs(video.currentTime - nextTime) > 1 / 120) {
          video.currentTime = nextTime;
        }
      }
    };

    const handleLoadedData = () => {
      if (disposed) {
        return;
      }

      video.pause();
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      setReady(true);
    };

    const handleLoadedMetadata = () => {
      if (disposed) {
        return;
      }

      duration = Number.isFinite(video.duration) ? video.duration : 0;
      currentProgress = 0;
      targetProgress = 0;
    };

    const handleVisibilityChange = () => {
      isDocumentVisible = document.visibilityState !== "hidden";
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );

    intersectionObserver.observe(host);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (video.readyState >= 2) {
      handleLoadedData();
    } else {
      video.addEventListener("loadeddata", handleLoadedData);
    }

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    const render = () => {
      if (!disposed) {
        if (isVisible && isDocumentVisible) {
          updateVideoState();
        }

        frameId = window.requestAnimationFrame(render);
      }
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.style.opacity = "";
    };
  }, [src]);

  return (
    <div ref={hostRef} className={styles.root}>
      <div className={styles.viewport}>
        <video
          ref={videoRef}
          src={src}
          className={`${styles.video} ${ready ? styles.ready : ""}`}
          aria-hidden="true"
          data-intro-ignore="true"
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}
