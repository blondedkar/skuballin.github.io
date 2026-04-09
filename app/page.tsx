"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import heroImage from "@/images/HeroImage.png";
import terminatorImage from "@/images/TerminatorSkub.png";
import { HeroShaderReveal } from "@/components/HeroShaderReveal";
import { SkubMark } from "@/components/SkubMark";

import styles from "./page.module.css";

export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const panelTrackRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

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

  useEffect(() => {
    const page = pageRef.current;
    const track = panelTrackRef.current;

    if (!page || !track) {
      return undefined;
    }

    const updatePanelProgress = () => {
      const rect = track.getBoundingClientRect();
      const total = Math.max(track.offsetHeight - window.innerHeight, 5);
      const progress = Math.min(Math.max(-rect.top / total, 0), 1);
      page.style.setProperty("--panel-progress", progress.toFixed(3));
      document.documentElement.style.setProperty("--panel-progress-global", progress.toFixed(3));
    };

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = window.requestAnimationFrame(updatePanelProgress);
    };

    updatePanelProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      document.documentElement.style.removeProperty("--panel-progress-global");

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  return (
    <main ref={pageRef} className={styles.page}>
      <header className={styles.topBar}>
        <nav className={styles.topNav} aria-label="Primary">
          <a href="#skub" className={styles.topNavMarkLink} aria-label="Skub mark home">
            <SkubMark className={styles.topNavMark} label="Tiger-hover Skub mark" />
          </a>
          <a href="#mlb-profile" className={styles.topNavLink}>
            MLB PROFILE
          </a>
          <a href="#the-stats" className={styles.topNavLink}>
            THE STATS
          </a>
          <a href="#accolades" className={styles.topNavLink}>
            ACCOLADES
          </a>
        </nav>
      </header>
      <section ref={panelTrackRef} className={styles.panelTrack}>
        <div className={styles.panelBackdrop} aria-hidden="true">
          <div className={styles.previewSection}>
            <div className={styles.runItBackIntro}>
              <span className={`${styles.runWord} ${styles.runWordEllipsis}`}>...</span>
              <span className={`${styles.runWord} ${styles.runWordLets}`}>LET'S</span>
              <span className={`${styles.runWord} ${styles.runWordRun}`}>RUN</span>
              <span className={`${styles.runWord} ${styles.runWordIt}`}>IT</span>
              <span className={`${styles.runWord} ${styles.runWordBack}`}>BACK</span>
            </div>
          </div>
        </div>
        <div className={styles.panelSticky}>
          <section id="skub" className={styles.heroSection}>
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
                <h2 className={`${styles.heroTitle} ${styles.heroTitleFill}`}>
                  <span>SKU</span>
                  <span className={styles.heroTitleBFill}>B</span>
                  <span>AL</span>
                </h2>
              </div>
              <div className={styles.heroTitleRowOver} aria-hidden="true">
                <span className={`${styles.heroTitle} ${styles.titleGhostSpacer}`}>TARIK</span>
                <h2 className={`${styles.heroTitle} ${styles.heroTitleOver}`}>
                  <span>SKU</span>
                  <span className={styles.heroTitleBOnly}>B</span>
                  <span>AL</span>
                </h2>
              </div>
              <div
                className={styles.heroFigureWrap}
                style={
                  {
                    aspectRatio: `${heroImage.width} / ${heroImage.height}`,
                  } as CSSProperties
                }
              >
                <div className={styles.figureGlow} />
                <HeroShaderReveal
                  alt="Tarik Skubal throwing"
                  baseSrc={heroImage.src}
                  revealSrc={terminatorImage.src}
                />
              </div>
            </div>
          </section>
        </div>
      </section>
      <section id="mlb-profile" className={styles.contentSection}>
        <p className={styles.sectionKicker}>MLB PROFILE</p>
        <h2 className={styles.sectionTitle}>SKUB AT A GLANCE</h2>
        <p className={styles.sectionCopy}>
          This section now sits directly behind the landing hero, so the page opens on
          Skub and then reveals the profile layer first as the screen compresses.
        </p>
      </section>
      <section id="the-stats" className={styles.contentSectionAlt}>
        <p className={styles.sectionKicker}>THE STATS</p>
        <h2 className={styles.sectionTitle}>DOMINANT BY DESIGN</h2>
        <p className={styles.sectionCopy}>
          Once the profile section settles in, this is the next stop for the deeper
          numbers and season breakdowns.
        </p>
      </section>
      <section id="accolades" className={styles.contentSection}>
        <p className={styles.sectionKicker}>ACCOLADES</p>
        <h2 className={styles.sectionTitle}>HARDWARE AND HYPE</h2>
        <p className={styles.sectionCopy}>
          Awards, milestones, and everything else worth surfacing can live here once
          we swap the placeholder copy for the real content.
        </p>
      </section>
    </main>
  );
}
