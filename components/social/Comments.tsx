"use client";

import { useState, useTransition } from "react";
import { deleteCommentAction, postCommentAction } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface CommentShape {
  id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export function Comments({
  subjectKind,
  subjectId,
  comments,
  myUserId,
  displayNames,
  path,
}: {
  subjectKind: string;
  subjectId: string;
  comments: CommentShape[];
  myUserId: string | null;
  displayNames: Record<string, string | null>;
  path: string;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("subject_kind", subjectKind);
    fd.set("subject_id", subjectId);
    fd.set("body", body);
    fd.set("path", path);
    startTransition(async () => {
      await postCommentAction(fd);
      setBody("");
    });
  }

  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="bg-muted/30 rounded-md p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {displayNames[c.user_id] ?? "buddy"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line">{c.body}</p>
              {c.user_id === myUserId && (
                <form
                  action={async (fd) => {
                    fd.set("id", c.id);
                    fd.set("path", path);
                    await deleteCommentAction(fd);
                  }}
                  className="mt-1"
                >
                  <button
                    type="submit"
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    Delete
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {myUserId && (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Comment…"
          />
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={!body.trim() || isPending}
          >
            Post
          </Button>
        </div>
      )}
    </div>
  );
}
