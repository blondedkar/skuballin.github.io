"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroImage from "@/images/HeroImage.png";
import skubQuoteImage from "@/images/SkubQuote.png";
import terminatorImage from "@/images/TerminatorSkub.png";
import { HeroShaderReveal } from "@/components/HeroShaderReveal";
import { SkubMark } from "@/components/SkubMark";
import { StoryDetroitWord } from "@/components/StoryDetroitWord";

import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const panelTrackRef = useRef<HTMLElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const storyScrollPanelRef = useRef<HTMLDivElement | null>(null);
  const storyMediaPaneRef = useRef<HTMLDivElement | null>(null);
  const storyMediaAssetRef = useRef<HTMLDivElement | null>(null);
  const storyDetroitPathRef = useRef<SVGPathElement | null>(null);
  const storyBodyRef = useRef<HTMLParagraphElement | null>(null);
  const marqueeCopies = useMemo(() => Array.from({ length: 10 }), []);

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
      const storySlideProgress = Math.min(Math.max((progress - 0.12) * 1.5, 0), 1);
      const storyPanelEnter = Math.min(Math.max((storySlideProgress - 0.62) * 3.1, 0), 1);
      const exitProgress = Math.min(Math.max((progress - 0.34) * 1.65, 0), 1);
      const videoRevealProgress =
        exitProgress <= 0.14
          ? 0
          : exitProgress >= 0.9
            ? 1
            : (() => {
                const t = (exitProgress - 0.14) / (0.9 - 0.14);
                return t * t * (3 - 2 * t);
              })();

      page.style.setProperty("--panel-progress", progress.toFixed(3));
      document.documentElement.style.setProperty("--panel-progress-global", progress.toFixed(3));
      document.documentElement.style.setProperty("--video-reveal-progress-global", videoRevealProgress.toFixed(3));

      window.dispatchEvent(
        new CustomEvent("skub:video-reveal-progress", {
          detail: { progress: videoRevealProgress },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("skub:story-panel-progress", {
          detail: {
            progress: storyPanelEnter,
          },
        }),
      );
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
      document.documentElement.style.removeProperty("--video-reveal-progress-global");

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const pane = storyMediaPaneRef.current;

    if (!pane) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = pane.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const offsetX = (x - 0.5) * 18;
      const offsetY = (y - 0.5) * 18;

      pane.style.setProperty("--story-parallax-x", `${offsetX.toFixed(2)}px`);
      pane.style.setProperty("--story-parallax-y", `${offsetY.toFixed(2)}px`);
    };

    const resetPointer = () => {
      pane.style.setProperty("--story-parallax-x", "0px");
      pane.style.setProperty("--story-parallax-y", "0px");
    };

    resetPointer();
    pane.addEventListener("pointermove", handlePointerMove);
    pane.addEventListener("pointerleave", resetPointer);

    return () => {
      pane.removeEventListener("pointermove", handlePointerMove);
      pane.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  useEffect(() => {
    const track = panelTrackRef.current;
    const storyPanel = storyScrollPanelRef.current;
    const media = storyMediaAssetRef.current;
    const detroitPath = storyDetroitPathRef.current;
    const body = storyBodyRef.current;

    if (!track || !storyPanel || !media || !detroitPath || !body) {
      return undefined;
    }

    const pathLength = detroitPath.getTotalLength();

    gsap.set(media, { xPercent: 34, opacity: 0 });
    gsap.set(body, { x: 18, opacity: 0 });
    gsap.set(detroitPath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      strokeOpacity: 1,
    });
    

    const handleStoryProgress = (event: Event) => {
      const customEvent = event as CustomEvent<{ progress?: number }>;
      const progress = Math.min(Math.max(customEvent.detail?.progress ?? 0, 0), 1);
      const imageProgress = gsap.utils.clamp(0, 1, (progress - 0.08) / 0.92);
      const textProgress = gsap.utils.clamp(0, 1, (progress - 0.02) / 0.94);

      gsap.to(media, {
        xPercent: (1 - imageProgress) * 34,
        opacity: imageProgress,
        duration: 0.22,
        ease: "power3.out",
        overwrite: true,
      });

      gsap.to(body, {
        x: (1 - textProgress) * 18,
        opacity: textProgress,
        duration: 0.22,
        ease: "power2.out",
        overwrite: true,
      });
    };

    window.addEventListener("skub:story-panel-progress", handleStoryProgress as EventListener);

    const detroitTween = gsap.fromTo(
      detroitPath,
      {
        strokeDashoffset: pathLength,
      },
      {
        strokeDashoffset: 0,
        ease: "sine.in",
        scrollTrigger: {
          trigger: track,
          start: "29% top",
          end: "45% top",
          scrub: true,
        },
      },
    );

    return () => {
      window.removeEventListener("skub:story-panel-progress", handleStoryProgress as EventListener);
      detroitTween.kill();
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
        <div className={styles.panelBackdrop} aria-hidden="true" />
        <div className={styles.panelSticky}>
          <section id="skub" className={styles.heroSection}>
            <div className={styles.heroSimple}>
              <div className={styles.heroTitleRowUnder}>
                <h1 className={`${styles.heroTitle} ${styles.heroTitleUnder} ${styles.heroTarikWord}`}>TARIK</h1>
                <h2 className={`${styles.heroTitle} ${styles.heroTitleUnderB} ${styles.heroSkubalWord}`} aria-hidden="true">
                  <span className={styles.titleGhostLetter}>S</span>
                  <span className={styles.titleGhostLetter}>K</span>
                  <span className={styles.titleGhostLetter}>U</span>
                  <span className={styles.heroTitleBUnder}>B</span>
                  <span className={styles.titleGhostLetter}>A</span>
                  <span className={styles.titleGhostLetter}>L</span>
                </h2>
              </div>
              <div className={styles.heroTitleRowMid} aria-hidden="true">
                <span className={`${styles.heroTitle} ${styles.titleGhostSpacer} ${styles.heroTarikWord}`}>TARIK</span>
                <h2 className={`${styles.heroTitle} ${styles.heroTitleFill} ${styles.heroSkubalWord}`}>
                  <span>SKU</span>
                  <span className={styles.heroTitleBFill}>B</span>
                  <span>AL</span>
                </h2>
              </div>
              <div className={styles.heroTitleRowOver} aria-hidden="true">
                <span className={`${styles.heroTitle} ${styles.titleGhostSpacer} ${styles.heroTarikWord}`}>TARIK</span>
                <h2 className={`${styles.heroTitle} ${styles.heroTitleOver} ${styles.heroSkubalWord}`}>
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
            <div ref={storyScrollPanelRef} className={styles.storyScrollPanel}>
              <div ref={storyMediaPaneRef} className={styles.storyMediaPane}>
                <div ref={storyMediaAssetRef} className={styles.storyMediaAsset}>
                  <div
                    className={styles.storyMediaFill}
                    aria-hidden="true"
                    style={{ "--story-image": `url(${skubQuoteImage.src})` } as CSSProperties}
                  />
                </div>
              </div>
              <div className={styles.storyCopyPane}>
                <h2 className={styles.storyHeadline}>
                  <StoryDetroitWord
                    className={styles.storyHeadlineDrawn}
                    pathRef={(node) => {
                      storyDetroitPathRef.current = node;
                    }}
                  />
                </h2>
                <div className={styles.storyMarquee} aria-hidden="true">
                  <div className={styles.storyMarqueeViewport}>
                    <div className={styles.storyMarqueeTrack}>
                      {[0, 1].map((groupIndex) => (
                        <div key={`runback-group-${groupIndex}`} className={styles.storyMarqueeGroup}>
                          {marqueeCopies.map((_, index) => (
                            <span key={`runback-${groupIndex}-${index}`} className={styles.storyMarqueeItem}>
                              Lets Run It Back
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p ref={storyBodyRef} className={styles.storyBody}>
                  "...It's a new era of Tigers baseball, and we're building something different.
                  and we're building something different. A new standard has been set, and we're about to clock in like
                  the blue-collar people of this city. So, say what you what about us...
                  
                  about Detroit...

                  we have unfinished business, so...lets run it back."
                </p>
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
