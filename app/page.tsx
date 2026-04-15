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
import { StorySignature } from "@/components/StorySignature";

import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);
  const panelTrackRef = useRef<HTMLElement | null>(null);
  const rewindSectionRef = useRef<HTMLElement | null>(null);
  const rewindTitleRef = useRef<SVGSVGElement | null>(null);
  const rewindGreyRefs = useRef<SVGTextElement[]>([]);
  const rewindGreenRefs = useRef<SVGTextElement[]>([]);
  const rewindRailViewportRef = useRef<HTMLDivElement | null>(null);
  const rewindRailTrackRef = useRef<HTMLDivElement | null>(null);
  const rewindLeadCardRef = useRef<HTMLDivElement | null>(null);
  const storyMediaPaneRef = useRef<HTMLDivElement | null>(null);
  const storyMediaAssetRef = useRef<HTMLDivElement | null>(null);
  const storyMediaOverlayRef = useRef<HTMLDivElement | null>(null);
  const storyMediaOverlayFillRef = useRef<HTMLDivElement | null>(null);
  const storyDetroitPathRef = useRef<SVGPathElement | null>(null);
  const storyBodyRef = useRef<HTMLDivElement | null>(null);
  const storySignatureRef = useRef<SVGSVGElement | null>(null);
  const marqueeCopies = useMemo(() => Array.from({ length: 10 }), []);
  const rewindPlaceholders = useMemo(() => Array.from({ length: 6 }), []);

  useEffect(() => {
    const page = pageRef.current;
    const track = panelTrackRef.current;

    if (!page || !track) {
      return undefined;
    }

    const applyPanelProgress = (progress: number) => {
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
    };

    const panelProgressTrigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        applyPanelProgress(self.progress);
      },
      onUpdate: (self) => {
        applyPanelProgress(self.progress);
      },
    });

    applyPanelProgress(panelProgressTrigger.progress);

    return () => {
      panelProgressTrigger.kill();
      document.documentElement.style.removeProperty("--panel-progress-global");
      document.documentElement.style.removeProperty("--video-reveal-progress-global");
    };
  }, []);

  useEffect(() => {
    const track = panelTrackRef.current;
    const storyPane = storyMediaPaneRef.current;
    const media = storyMediaAssetRef.current;
    const mediaOverlay = storyMediaOverlayRef.current;
    const mediaOverlayFill = storyMediaOverlayFillRef.current;
    const rewindSection = rewindSectionRef.current;
    const rewindTitle = rewindTitleRef.current;
    const rewindRailViewport = rewindRailViewportRef.current;
    const rewindRailTrack = rewindRailTrackRef.current;
    const rewindLeadCard = rewindLeadCardRef.current;
    const detroitPath = storyDetroitPathRef.current;
    const body = storyBodyRef.current;
    const signature = storySignatureRef.current;

    if (
      !track ||
      !storyPane ||
      !media ||
      !mediaOverlay ||
      !mediaOverlayFill ||
      !rewindSection ||
      !rewindTitle ||
      !rewindRailViewport ||
      !rewindRailTrack ||
      !rewindLeadCard ||
      !detroitPath ||
      !body ||
      !signature
    ) {
      return undefined;
    }

    const pathLength = detroitPath.getTotalLength();
    const signaturePaths = Array.from(signature.querySelectorAll("path"));
    const rewindGreyPaths = rewindGreyRefs.current.filter(Boolean);
    const rewindGreenPaths = rewindGreenRefs.current.filter(Boolean);
    let overlayBaseTop = 0;
    let overlayBaseLeft = 0;
    let overlayBaseWidth = 0;
    let overlayBaseHeight = 0;
    const overlayScrollSpeed = 0.45;
    let signatureDelayId: number | null = null;
    let signatureHasPlayed = false;
    gsap.set(media, { opacity: 1 });
    gsap.set(body, { x: 18, opacity: 0 });
    gsap.set(signature, { opacity: 0.96 });
    gsap.set(detroitPath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      strokeOpacity: 1,
    });
    signaturePaths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        opacity: 0,
      });
    });
    [...rewindGreyPaths, ...rewindGreenPaths].forEach((textNode) => {
      const length = Math.max(textNode.getComputedTextLength(), 1);
      gsap.set(textNode, {
        strokeDasharray: length,
        strokeDashoffset: length,
        opacity: 0,
      });
    });
    gsap.set(mediaOverlay, {
      autoAlpha: 0,
      position: "fixed",
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      transformOrigin: "top left",
    });
    gsap.set(mediaOverlayFill, {
      clipPath: "polygon(0 0, 79% 0, 73% 18%, 76% 42%, 70% 68%, 74% 100%, 0 100%)",
    });

    const applyStoryProgress = (progress: number) => {
      const textProgress = gsap.utils.clamp(0, 1, (progress - 0.02) / 0.94);

      gsap.set(media, { opacity: 1 });
      gsap.to(body, {
        x: (1 - textProgress) * 18,
        opacity: textProgress,
        duration: 0.22,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const syncOverlayBounds = () => {
      const rect = media.getBoundingClientRect();
      overlayBaseTop = rect.top;
      overlayBaseLeft = rect.left;
      overlayBaseWidth = rect.width;
      overlayBaseHeight = rect.height;

      gsap.set(mediaOverlay, {
        top: overlayBaseTop,
        left: overlayBaseLeft,
        width: overlayBaseWidth,
        height: overlayBaseHeight,
      });
    };

    const showOverlay = (shouldMeasure = false) => {
      if (shouldMeasure) {
        syncOverlayBounds();
      }
      gsap.set(media, { autoAlpha: 0 });
      gsap.set(mediaOverlay, { autoAlpha: 1 });
    };

    const hideOverlay = () => {
      gsap.set(media, { autoAlpha: 1 });
      gsap.set(mediaOverlay, { autoAlpha: 0 });
    };

    const syncRewindRailSizing = () => {
      if (overlayBaseWidth <= 0 || overlayBaseHeight <= 0) {
        syncOverlayBounds();
      }

      const finalWidth = Math.max(overlayBaseWidth * 0.4, 180);
      const finalHeight = Math.max(overlayBaseHeight * 0.65, 260);
      const finalTop = Math.max((window.innerHeight * 0.58) - (finalHeight * 0.5), 24);
      const finalLeft = Math.max(window.innerWidth * 0.08, 24);

      rewindSection.style.setProperty("--rewind-card-width", `${finalWidth.toFixed(2)}px`);
      rewindSection.style.setProperty("--rewind-card-height", `${finalHeight.toFixed(2)}px`);
      rewindSection.style.setProperty("--rewind-rail-left", `${finalLeft.toFixed(2)}px`);
      rewindSection.style.setProperty("--rewind-rail-top", `${finalTop.toFixed(2)}px`);
    };

    const getOverlayClipPath = (progress: number) => {
      const clamped = gsap.utils.clamp(0, 1, progress);
      const points = [
        [0, 0, 0, 0],
        [79, 0, 100, 0],
        [73, 18, 100, 0],
        [76, 42, 100, 50],
        [70, 68, 100, 100],
        [74, 100, 100, 100],
        [0, 100, 0, 100],
      ];

      return `polygon(${points
        .map(([fromX, fromY, toX, toY]) => {
          const x = fromX + ((toX - fromX) * clamped);
          const y = fromY + ((toY - fromY) * clamped);

          return `${x}% ${y}%`;
        })
        .join(", ")})`;
    };

    const storyProgressTrigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        const storySlideProgress = Math.min(Math.max((self.progress - 0.12) * 1.5, 0), 1);
        const storyPanelEnter = Math.min(Math.max((storySlideProgress - 0.62) * 3.1, 0), 1);
        applyStoryProgress(storyPanelEnter);
      },
      onUpdate: (self) => {
        const storySlideProgress = Math.min(Math.max((self.progress - 0.12) * 1.5, 0), 1);
        const storyPanelEnter = Math.min(Math.max((storySlideProgress - 0.62) * 3.1, 0), 1);
        applyStoryProgress(storyPanelEnter);
      },
    });

    const storyMediaPinTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: "bottom bottom",
        end: "bottom+=50% bottom",
        markers: true,
        onRefresh: (self) => {
          if (!self.isActive) {
            syncOverlayBounds();
            syncRewindRailSizing();
          }
        },
        onEnter: () => {
          showOverlay(true);
        },
        onLeave: () => {
          showOverlay(false);
        },
        onEnterBack: () => {
          showOverlay(false);
        },
        onLeaveBack: () => {
          hideOverlay();
        },
        onUpdate: (self) => {
          showOverlay(false);
          const progress = self.progress;
          const width = overlayBaseWidth * (1 - (progress * 0.6));
          const height = overlayBaseHeight * (1 - (progress * 0.35));
          gsap.set(mediaOverlay, {
            top: overlayBaseTop + ((self.scroll() - self.start) * overlayScrollSpeed),
            left: overlayBaseLeft,
            width,
            height,
          });
          gsap.set(mediaOverlayFill, {
            clipPath: getOverlayClipPath(progress),
          });
        },
      },
    });

    storyMediaPinTimeline.to({}, { duration: 1 });

    const playSignature = () => {
      if (signatureHasPlayed) {
        return;
      }

      signatureHasPlayed = true;
      gsap.timeline()
        .to(signaturePaths, {
          opacity: 1,
          duration: 0.01,
          stagger: 0.08,
        })
        .to(
          signaturePaths,
          {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.out",
            stagger: 0.14,
          },
          0,
        );
    };

    const signatureTrigger = ScrollTrigger.create({
      trigger: track,
      start: "29% top",
      end: "29% top",
      markers: true,
      onEnter: () => {
        if (signatureHasPlayed || signatureDelayId !== null) {
          return;
        }

        signatureDelayId = window.setTimeout(() => {
          signatureDelayId = null;
          playSignature();
        }, 1500);
      },
      onLeaveBack: () => {
        if (signatureHasPlayed) {
          return;
        }

        if (signatureDelayId !== null) {
          window.clearTimeout(signatureDelayId);
          signatureDelayId = null;
        }
      },
    });

    const rewindTitleTween = gsap.timeline({
      paused: true,
    })
      .to(rewindGreyPaths, {
        opacity: 0.42,
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.08,
      })
      .to(
        rewindGreenPaths,
        {
          opacity: 1,
          strokeDashoffset: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.08,
        },
        0.18,
      );

    const rewindTitleTrigger = ScrollTrigger.create({
      trigger: track,
      start: "bottom+=50% bottom",
      end: "bottom+=50% bottom",
      markers: true,
      onEnter: () => {
        rewindTitleTween.play(0);
      },
    });

    const rewindHandoffTrigger = ScrollTrigger.create({
      trigger: rewindSection,
      start: "top top",
      end: "top top",
      markers: true,
      onEnter: () => {
        gsap.set(mediaOverlay, { autoAlpha: 0 });
        gsap.set(rewindLeadCard, { autoAlpha: 1 });
      },
      onLeaveBack: () => {
        showOverlay(false);
        gsap.set(rewindLeadCard, { autoAlpha: 1 });
      },
    });

    const rewindRailTween = gsap.timeline({ paused: true });

    const syncRewindRailAnimation = () => {
      syncRewindRailSizing();
      const viewportWidth = rewindRailViewport.clientWidth;
      const trackWidth = rewindRailTrack.scrollWidth;
      const hiddenTravel = Math.max(trackWidth - viewportWidth, 0);
      const entryTravel = viewportWidth + (overlayBaseWidth * 0.2);
      const scrollDistance = (entryTravel + hiddenTravel) * 1.85;

      rewindSection.style.setProperty("--rewind-scroll-distance", `${scrollDistance.toFixed(2)}px`);

      gsap.set(rewindRailTrack, { x: -entryTravel });

      rewindRailTween.clear()
        .to(rewindRailTrack, {
          x: 0,
          duration: entryTravel / Math.max(entryTravel + hiddenTravel, 1),
          ease: "power2.out",
        })
        .to(rewindRailTrack, {
          x: -hiddenTravel,
          duration: hiddenTravel / Math.max(entryTravel + hiddenTravel, 1),
          ease: "none",
        });
    };

    const rewindRailTrigger = ScrollTrigger.create({
      trigger: rewindSection,
      start: "top top",
      end: () => {
        const viewportWidth = rewindRailViewport.clientWidth;
        const hiddenTravel = Math.max(rewindRailTrack.scrollWidth - viewportWidth, 0);
        const entryTravel = viewportWidth + (overlayBaseWidth * 0.2);

        return `+=${Math.max((entryTravel + hiddenTravel) * 1.85, viewportWidth)}`;
      },
      scrub: true,
      markers: true,
      invalidateOnRefresh: true,
      animation: rewindRailTween,
      onRefresh: () => {
        syncRewindRailAnimation();
      },
    });

    syncRewindRailAnimation();

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
      storyProgressTrigger.kill();
      storyMediaPinTimeline.kill();
      if (signatureDelayId !== null) {
        window.clearTimeout(signatureDelayId);
      }
      signatureTrigger.kill();
      rewindTitleTrigger.kill();
      rewindRailTrigger.kill();
      rewindTitleTween.kill();
      rewindRailTween.kill();
      rewindHandoffTrigger.kill();
      gsap.set(media, { clearProps: "opacity,visibility" });
      gsap.set(mediaOverlay, { clearProps: "position,top,left,width,height,opacity,visibility,transformOrigin" });
      gsap.set(mediaOverlayFill, { clearProps: "clipPath" });
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
            <div className={styles.storyScrollPanel}>
              <div ref={storyMediaPaneRef} className={styles.storyMediaPane}>
                <div ref={storyMediaAssetRef} className={styles.storyMediaAsset}>
                  <div
                    className={styles.storyMediaFill}
                    aria-hidden="true"
                    style={
                      {
                        "--story-image": `url(${skubQuoteImage.src})`,
                        "--story-image-position": "38% center",
                      } as CSSProperties
                    }
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
                <div ref={storyBodyRef} className={styles.storyBody}>
                  <div className={styles.storyBodyTop}>
                    <div className={styles.storyBodyDivider} aria-hidden="true" />
                    <div className={styles.storyBodyColumn}>
                      <p className={styles.storyBodyCopy}>
                        "...Say what you want about us.
                      </p>
                      <div className={styles.storyBodyInlineDetroit}>
                        <span className={styles.storyBodyLabel}>about</span>
                        <StoryDetroitWord className={styles.storyDetroitInline} />
                      </div>
                      <p className={styles.storyBodyCopy}>
                        We have{" "}
                        <span
                          className={styles.storyUnfinishedBusiness}
                          data-text="unfinished business"
                        >
                          unfinished business
                        </span>
                        , so <span className={styles.storyRunItBack}>lets run it back.</span>&quot;
                      </p>
                    </div>
                  </div>
                  <div className={styles.storySignatureSlot} aria-hidden="true">
                    <StorySignature
                      className={styles.storySignature}
                      svgRef={(node) => {
                        storySignatureRef.current = node;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
      <section ref={rewindSectionRef} id="mlb-profile" className={`${styles.contentSection} ${styles.rewindSection}`}>
        <div className={styles.rewindPinSpacer}>
          <div className={styles.rewindPinSticky}>
            <div className={styles.rewindCopy}>
              <svg
                ref={rewindTitleRef}
                viewBox="0 0 2400 320"
                className={styles.rewindTitle}
                aria-label="A YEAR IN REWIND."
                role="img"
              >
                <text
                  x="50%"
                  y="54%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={styles.rewindGrey}
                  ref={(node) => {
                    if (node) {
                      rewindGreyRefs.current[0] = node;
                    }
                  }}
                >
                  A YEAR IN REWIND.
                </text>
                <text
                  x="50%"
                  y="54%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={styles.rewindGreen}
                  ref={(node) => {
                    if (node) {
                      rewindGreenRefs.current[0] = node;
                    }
                  }}
                >
                  A YEAR IN REWIND.
                </text>
              </svg>
            </div>
            <div className={styles.rewindRailAnchor}>
              <div ref={rewindRailViewportRef} className={styles.rewindRailViewport}>
                <div ref={rewindRailTrackRef} className={styles.rewindRailTrack}>
                  {rewindPlaceholders.map((_, index) => (
                    <div
                      key={`rewind-placeholder-${index}`}
                      ref={index === 0 ? rewindLeadCardRef : undefined}
                      className={`${styles.rewindCard} ${index === 0 ? styles.rewindCardLead : ""}`}
                    >
                      {index === 0 ? (
                        <div className={styles.rewindLeadMedia}>
                          <div
                            className={styles.rewindLeadFill}
                            aria-hidden="true"
                            style={
                              {
                                "--story-image": `url(${skubQuoteImage.src})`,
                                "--story-image-position": "38% center",
                              } as CSSProperties
                            }
                          />
                        </div>
                      ) : (
                        <div className={styles.rewindCardInner}>
                          <span className={styles.rewindCardLabel}>{String(index + 1).padStart(2, "0")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="the-stats" className={styles.contentSectionAlt}>
      </section>
      <section id="accolades" className={styles.contentSection}>
      </section>
      <div ref={storyMediaOverlayRef} className={styles.storyMediaOverlay} aria-hidden="true">
        <div
          ref={storyMediaOverlayFillRef}
          className={styles.storyMediaFill}
          style={
            {
              "--story-image": `url(${skubQuoteImage.src})`,
              "--story-image-position": "38% center",
            } as CSSProperties
          }
        />
      </div>
    </main>
  );
}
