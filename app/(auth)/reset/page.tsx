import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-md items-center justify-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="bg-success/15 text-success mb-4 rounded-md p-3 text-sm">
              Reset email sent. Check your inbox.
            </p>
          ) : (
            <>
              {error && (
                <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
                  Couldn&apos;t send the reset email — try again.
                </p>
              )}
              <form action={requestPasswordResetAction} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <Button type="submit" className="w-full">
                  Send reset link
                </Button>
              </form>
            </>
          )}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            <Link href="/login" className="hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
