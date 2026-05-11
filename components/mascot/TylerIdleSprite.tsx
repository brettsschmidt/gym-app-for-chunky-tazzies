"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_FRAMES = [
  "/branding/mascot/tyler/idle/frame_000.png",
  "/branding/mascot/tyler/idle/frame_001.png",
  "/branding/mascot/tyler/idle/frame_002.png",
  "/branding/mascot/tyler/idle/frame_003.png",
  "/branding/mascot/tyler/idle/frame_004.png",
  "/branding/mascot/tyler/idle/frame_005.png",
  "/branding/mascot/tyler/idle/frame_006.png",
  "/branding/mascot/tyler/idle/frame_007.png",
];

const STATIC_FALLBACK = "/branding/mascot/tyler.png";
const FRAME_MS = 130;

/**
 * Cycles through Tyler's pixellab-generated idle frames. If the frames don't
 * exist yet (or any fail to load), gracefully falls back to the static
 * tyler.png — so this is safe to ship before/while the animation job lands.
 */
export function TylerIdleSprite({
  size = 56,
  className = "",
  alt = "Tyler the Hot Dog",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [index, setIndex] = useState(0);
  const [framesReady, setFramesReady] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let cancelled = false;
    Promise.all(
      IDLE_FRAMES.map(
        (src) =>
          new Promise<boolean>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
          }),
      ),
    ).then((results) => {
      if (!cancelled && results.every(Boolean)) setFramesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!framesReady || reducedMotion.current) return;
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id != null) return;
      id = setInterval(() => {
        setIndex((i) => (i + 1) % IDLE_FRAMES.length);
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
  }, [framesReady]);

  const src = framesReady ? IDLE_FRAMES[index] : STATIC_FALLBACK;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
      className={className}
    />
  );
}
