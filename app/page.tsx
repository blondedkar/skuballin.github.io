"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

import heroImage from "@/images/HeroImage.png";
import { SkubMark } from "@/components/SkubMark";

import styles from "./page.module.css";

const floatingPhrases = [
  "The Premiere Southpaw",
  "SKUUUUB",
  "Triple Crown",
  "900 K's",
  "Mr. Whiff",
  "The Changeup",
  "2x Cy Young",
  "Super Skubs",
  "THE TERMINATOR",
  "SCOOBY DOOBY DOO",
  "Jack (iykyk)",
] as const;

const phraseLanes = [10, 16, 22, 29, 35, 42, 49, 57, 65, 74, 83] as const;

type PhraseConfig = {
  phrase: string;
  delay: string;
  duration: string;
  top: string;
  startX: string;
  driftX: string;
  settleX: string;
  glideX: string;
  endX: string;
  rotate: string;
  rotateX: string;
  rotateY: string;
  skewX: string;
  driftY: string;
  settleY: string;
  glideY: string;
  endY: string;
  size: string;
  opacity: number;
  startScale: number;
  settleScale: number;
  glideScale: number;
  endScale: number;
  parallaxX: number;
  parallaxY: number;
  rippleScale: number;
  rippleTilt: string;
};

function createPhraseConfigs(): PhraseConfig[] {
  const shuffledLanes = [...phraseLanes]
    .map((lane) => ({ lane, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ lane }) => lane);

  return floatingPhrases.map((phrase, index) => {
    const startsFromLeft = Math.random() > 0.5;
    const top = shuffledLanes[index];
    const duration = 56 + Math.random() * 30;
    const delay = -Math.random() * duration;
    const rotate = -4 + Math.random() * 8;
    const rotateX = -(18 + Math.random() * 8);
    const rotateY = (startsFromLeft ? -1 : 1) * (8 + Math.random() * 6);
    const skewX = (startsFromLeft ? -1 : 1) * (2.5 + Math.random() * 2.5);
    const size = 1.15 + Math.random() * 1.7;
    const opacity = 0.1 + Math.random() * 0.12;
    const rippleScale = 0.85 + Math.random() * 0.6;
    const rippleTilt = `${(startsFromLeft ? -1 : 1) * (4 + Math.random() * 8)}deg`;
    const startX = startsFromLeft ? "-34vw" : "108vw";
    const driftX = startsFromLeft ? "-10vw" : "84vw";
    const settleX = startsFromLeft ? "34vw" : "42vw";
    const glideX = startsFromLeft ? "62vw" : "14vw";
    const endX = startsFromLeft ? "108vw" : "-42vw";
    const driftY = `${(-1.2 + Math.random() * 2.4).toFixed(2)}rem`;
    const settleY = `${(-0.8 + Math.random() * 1.6).toFixed(2)}rem`;
    const glideY = `${(-1.1 + Math.random() * 2.2).toFixed(2)}rem`;
    const endY = `${(-1.8 + Math.random() * 3.6).toFixed(2)}rem`;
    const startScale = 0.84 + Math.random() * 0.05;
    const settleScale = 1 + Math.random() * 0.03;
    const glideScale = 0.92 + Math.random() * 0.04;
    const endScale = 0.82 + Math.random() * 0.05;

    return {
      phrase,
      delay: `${delay.toFixed(2)}s`,
      duration: `${duration.toFixed(2)}s`,
      top: `${top}%`,
      startX,
      driftX,
      settleX,
      glideX,
      endX,
      rotate: `${rotate.toFixed(2)}deg`,
      rotateX: `${rotateX.toFixed(2)}deg`,
      rotateY: `${rotateY.toFixed(2)}deg`,
      skewX: `${skewX.toFixed(2)}deg`,
      driftY,
      settleY,
      glideY,
      endY,
      size: `${size.toFixed(2)}rem`,
      opacity: Number(opacity.toFixed(2)),
      startScale: Number(startScale.toFixed(2)),
      settleScale: Number(settleScale.toFixed(2)),
      glideScale: Number(glideScale.toFixed(2)),
      endScale: Number(endScale.toFixed(2)),
      parallaxX: ((index % 4) + 1) * (startsFromLeft ? 0.32 : -0.32),
      parallaxY: ((index % 3) + 1) * (index % 2 === 0 ? 0.24 : -0.24),
      rippleScale: Number(rippleScale.toFixed(2)),
      rippleTilt,
    };
  });
}

export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [phraseConfigs, setPhraseConfigs] = useState<PhraseConfig[]>([]);

  useEffect(() => {
    setPhraseConfigs(createPhraseConfigs());
  }, []);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return undefined;
    }

    const updateParallax = (clientX: number, clientY: number) => {
      const { innerWidth, innerHeight } = window;
      const offsetX = ((clientX / innerWidth) - 0.5) * 2;
      const offsetY = ((clientY / innerHeight) - 0.5) * 2;

      page.style.setProperty("--pointer-x", offsetX.toFixed(3));
      page.style.setProperty("--pointer-y", offsetY.toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        updateParallax(event.clientX, event.clientY);
      });
    };

    const handlePointerLeave = () => {
      page.style.setProperty("--pointer-x", "0");
      page.style.setProperty("--pointer-y", "0");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <main ref={pageRef} className={styles.page}>
      <div className={styles.markDock}>
        <SkubMark className={styles.mark} label="Tiger-hover Skub mark" />
      </div>
      <div className={styles.floatingPhraseLayer} aria-hidden="true">
        {phraseConfigs.map((config) => (
          <span
            key={config.phrase}
            className={styles.floatingPhraseItem}
            style={
              {
                "--phrase-delay": config.delay,
                "--phrase-duration": config.duration,
                "--phrase-top": config.top,
                "--phrase-start-x": config.startX,
                "--phrase-drift-x": config.driftX,
                "--phrase-settle-x": config.settleX,
                "--phrase-glide-x": config.glideX,
                "--phrase-end-x": config.endX,
                "--phrase-rotate": config.rotate,
                "--phrase-rotate-x": config.rotateX,
                "--phrase-rotate-y": config.rotateY,
                "--phrase-skew-x": config.skewX,
                "--phrase-drift-y": config.driftY,
                "--phrase-settle-y": config.settleY,
                "--phrase-glide-y": config.glideY,
                "--phrase-end-y": config.endY,
                "--phrase-size": config.size,
                "--phrase-opacity": config.opacity,
                "--phrase-start-scale": config.startScale,
                "--phrase-settle-scale": config.settleScale,
                "--phrase-glide-scale": config.glideScale,
                "--phrase-end-scale": config.endScale,
                "--parallax-x-strength": config.parallaxX,
                "--parallax-y-strength": config.parallaxY,
                "--ripple-scale": config.rippleScale,
                "--ripple-tilt": config.rippleTilt,
              } as CSSProperties
            }
          >
            <span className={styles.floatingPhraseRipple} />
            <span className={styles.floatingPhrase}>{config.phrase}</span>
          </span>
        ))}
      </div>
      <section className={styles.heroSection}>
        <div className={styles.heroSimple}>
          <div className={styles.heroTitleRowUnder}>
            <h1 className={`${styles.heroTitle} ${styles.heroTitleUnder}`}>TARIK</h1>
            <span
              className={`${styles.heroTitle} ${styles.titleGhostSpacer}`}
              aria-hidden="true"
            >
              SKUBAL
            </span>
          </div>
          <div className={styles.heroTitleRowMid} aria-hidden="true">
            <span className={`${styles.heroTitle} ${styles.titleGhostSpacer}`}>TARIK</span>
            <h2 className={`${styles.heroTitle} ${styles.heroTitleOver}`}>
              <span className={styles.titleGhostLetter}>SKU</span>
              <span className={styles.heroTitleBOnly}>B</span>
              <span className={styles.titleGhostLetter}>AL</span>
            </h2>
          </div>
          <div className={styles.heroTitleRowOver} aria-hidden="true">
            <span className={`${styles.heroTitle} ${styles.titleGhostSpacer}`}>TARIK</span>
            <h2 className={`${styles.heroTitle} ${styles.heroTitleOver}`}>
              <span>SKU</span>
              <span className={styles.titleGhostLetter}>B</span>
              <span>AL</span>
            </h2>
          </div>
          <div className={styles.heroFigureWrap}>
            <div className={styles.figureGlow} />
            <Image
              src={heroImage}
              alt="Tarik Skubal throwing"
              priority
              className={styles.heroFigure}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
