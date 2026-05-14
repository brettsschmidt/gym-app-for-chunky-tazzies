"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_FRAMES = [
  "/branding/mascot/brad/idle/frame_000.png",
  "/branding/mascot/brad/idle/frame_001.png",
  "/branding/mascot/brad/idle/frame_002.png",
  "/branding/mascot/brad/idle/frame_003.png",
];

const STATIC_FALLBACK = "/branding/mascot/brad.png";
const FRAME_MS = 220;

export function BradIdleSprite({
  size = 64,
  className = "",
  alt = "Brad the Goblin",
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
