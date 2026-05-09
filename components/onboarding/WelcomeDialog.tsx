"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Activity, Dumbbell, Salad, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ct-welcomed-v1";

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center pb-2">
            <Image
              src="/branding/logo-transparent.png"
              alt="Chunky Tazzies"
              width={120}
              height={120}
              className="h-auto w-24"
            />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to your tazzle 🐮
          </DialogTitle>
          <DialogDescription className="text-center">
            A <strong>tazzie</strong> is a chunky cow-colored cat — and also
            your best friend who comes to the gym with you. Your{" "}
            <em>tazzle</em> is the crew of tazzies you train and eat with.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-2 text-sm">
          <Feature
            icon={<Dumbbell className="size-4" />}
            title="Train"
            desc="Build templates, run programs, log every set, watch your PRs climb."
          />
          <Feature
            icon={<Salad className="size-4" />}
            title="Eat"
            desc="Log meals, track macros, build recipes, scan barcodes."
          />
          <Feature
            icon={<Activity className="size-4" />}
            title="Recover"
            desc="Cardio, mobility, sleep, and wellness all in one place."
          />
          <Feature
            icon={<Users className="size-4" />}
            title="Together"
            desc="Invite your tazzle, cheer each other on, share PRs and meals."
          />
        </ul>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full">
            Let&apos;s go 🐮
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-primary/10 text-primary mt-0.5 rounded-md p-1.5">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
