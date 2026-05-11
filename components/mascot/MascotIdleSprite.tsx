"use client";

import { useEffect, useRef, useState } from "react";

const FRAMES = [
  "/branding/mascot/idle/frame_000.png",
  "/branding/mascot/idle/frame_001.png",
  "/branding/mascot/idle/frame_002.png",
  "/branding/mascot/idle/frame_003.png",
  "/branding/mascot/idle/frame_004.png",
  "/branding/mascot/idle/frame_005.png",
  "/branding/mascot/idle/frame_006.png",
  "/branding/mascot/idle/frame_007.png",
];

const FRAME_MS = 150; // 8 frames × 150ms ≈ 1.2s loop

/**
 * Cycles through the idle animation frames generated via pixellab.
 * Pauses when the tab is hidden and respects prefers-reduced-motion.
 *
 * The static cat sprite (logo-transparent.png) is fine on its own; this is
 * the "live" version with real frame-by-frame motion.
 */
export function MascotIdleSprite({
  size = 32,
  className = "",
  alt = "Chunky Tazzies",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion.current) return;

    // Preload all frames so the cycle doesn't flash white during fetch.
    for (const src of FRAMES) {
      const img = new window.Image();
      img.src = src;
    }

    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id != null) return;
      id = setInterval(() => {
        setIndex((i) => (i + 1) % FRAMES.length);
      }, FRAME_MS);
    }
    function stop() {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FRAMES[index]}
      alt={alt}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
      className={className}
    />
  );
}
