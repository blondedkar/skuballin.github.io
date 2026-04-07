"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

import heroImage from "@/images/HeroImage.png";
import { SkubMark } from "@/components/SkubMark";

import styles from "./page.module.css";

const bannerSegments = [
  "The Premiere Southpaw",
  "2x Cy Young",
  "Changeup Maestro",
  "898 Ks and Counting",
];

function shuffleSegments(segments: string[]) {
  const next = [...segments];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function createBannerGroups() {
  return Array.from({ length: 3 }, () => shuffleSegments(bannerSegments));
}

export default function HomePage() {
  const [bannerGroups, setBannerGroups] = useState(() => createBannerGroups());
  const handleBannerIteration = useCallback(() => {
    setBannerGroups(createBannerGroups());
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.markDock}>
        <SkubMark className={styles.mark} label="Tiger-hover Skub mark" />
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
      <div className={styles.bottomBanner} aria-label={bannerSegments.join(" | ")}>
        <div className={styles.bottomBannerTrack} onAnimationIteration={handleBannerIteration}>
          {bannerGroups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={styles.bottomBannerGroup}
              aria-hidden={groupIndex > 0}
            >
              {group.map((segment, segmentIndex) => (
                <span key={`${groupIndex}-${segment}`} className={styles.bottomBannerText}>
                  {segment}
                  {segmentIndex < group.length - 1 ? " |" : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
