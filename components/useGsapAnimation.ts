"use client";

import { useEffect } from "react";
import gsap from "gsap";

type AnimationFactory = (gsapInstance: typeof gsap) => gsap.core.Tween | gsap.core.Timeline | void;

export function useGsapAnimation(factory: AnimationFactory, deps: React.DependencyList = []) {
  useEffect(() => {
    const animation = factory(gsap);

    return () => {
      animation?.kill();
    };
  }, deps);
}
