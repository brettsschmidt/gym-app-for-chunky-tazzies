"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Barcode, X } from "lucide-react";
import { toast } from "sonner";
import { createFoodAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";

interface DetectedFood {
  name: string;
  brand: string | null;
  serving_size_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  barcode: string;
}

declare global {
  interface Window {
    BarcodeDetector?: new (init?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export function BarcodeScanner({ tazzleId }: { tazzleId: string }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DetectedFood | null>(null);
  const [, startSave] = useTransition();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open || result || typeof window === "undefined") return;
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) return;

    let cancelled = false;
    const detector = new window.BarcodeDetector!({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        const tick = async () => {
          if (cancelled || !video) return;
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              await onCode(codes[0].rawValue);
              return;
            }
          } catch {
            /* ignore — sometimes the detector throws between frames */
          }
          requestAnimationFrame(tick);
        };
        tick();
      } catch {
        toast.info("Camera unavailable — enter the barcode manually.");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, result]);

  async function onCode(code: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/foods/lookup?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) {
        toast.error("No match for that barcode.");
        return;
      }
      const json = await res.json();
      setResult(json.food as DetectedFood);
    } catch {
      toast.error("Lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  function saveAsFood() {
    if (!result) return;
    const fd = new FormData();
    fd.set("chunky_tazzle_id", tazzleId);
    fd.set("name", result.name);
    if (result.brand) fd.set("brand", result.brand);
    fd.set("serving_size_g", String(result.serving_size_g));
    fd.set("kcal", String(result.kcal));
    fd.set("protein_g", String(result.protein_g));
    fd.set("carbs_g", String(result.carbs_g));
    fd.set("fat_g", String(result.fat_g));
    if (result.fiber_g != null) fd.set("fiber_g", String(result.fiber_g));
    fd.set("barcode", result.barcode);

    startSave(async () => {
      await createFoodAction(fd);
      toast.success("Added to your tazzle catalog");
    });
  }

  return (
    <div className="bg-muted rounded-md border border-dashed p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Barcode className="size-4" /> Barcode lookup
        </span>
        {open && (
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {!open && (
        <Button
          type="button"
          size="sm"
          className="mt-2"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          Scan / enter a code
        </Button>
      )}

      {open && !result && (
        <div className="mt-2 space-y-2">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded bg-black/40"
            playsInline
            muted
          />
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="EAN / UPC"
              className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
              inputMode="numeric"
            />
            <Button
              type="button"
              size="sm"
              disabled={busy || !manual.trim()}
              onClick={() => onCode(manual.trim())}
            >
              Look up
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-2 space-y-2 text-sm">
          <p>
            <strong>{result.name}</strong>
            {result.brand && <span className="text-muted-foreground"> · {result.brand}</span>}
          </p>
          <p className="text-muted-foreground text-xs">
            {result.kcal.toFixed(0)} kcal · P{result.protein_g.toFixed(0)} · C
            {result.carbs_g.toFixed(0)} · F{result.fat_g.toFixed(0)} per{" "}
            {result.serving_size_g} g
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveAsFood}>
              Add to catalog
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setResult(null)}
            >
              Try another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
