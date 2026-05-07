"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { createShareLinkAction } from "@/lib/actions/share";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ShareDialog({
  kind,
  subjectId,
  tazzleId,
}: {
  kind: "template" | "program" | "session" | "recipe";
  subjectId: string;
  tazzleId?: string;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const url =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${slug}`
      : null;

  async function generate(formData: FormData) {
    setBusy(true);
    const res = await createShareLinkAction(formData);
    setBusy(false);
    if ("error" in res) {
      toast.error("Couldn't create the link.");
    } else if (res.slug) {
      setSlug(res.slug);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="size-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share publicly</DialogTitle>
          <DialogDescription>
            Anyone with the link can view a read-only copy.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="space-y-2">
            <Input value={url} readOnly className="font-mono" />
            <Button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                toast.success("Copied");
              }}
            >
              <Copy className="size-4" /> Copy link
            </Button>
          </div>
        ) : (
          <form action={generate} className="space-y-3">
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="subject_id" value={subjectId} />
            {tazzleId && (
              <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="expires_in_days">Expires in (days, optional)</Label>
              <Input
                id="expires_in_days"
                name="expires_in_days"
                type="number"
                min={1}
                max={365}
                defaultValue={30}
              />
            </div>
            <Button type="submit" disabled={busy}>
              Generate link
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
