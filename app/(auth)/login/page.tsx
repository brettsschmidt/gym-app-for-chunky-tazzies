import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  invalid_credentials: "Wrong email or password.",
  invalid_input: "Check the email and password fields.",
  rate_limited: "Too many attempts — try again in a minute.",
  email_not_confirmed: "Please confirm your email first.",
  unknown: "Something went wrong. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>;
}) {
  const { error, reset, next } = await searchParams;
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-md items-center justify-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          {reset && (
            <p className="bg-success/15 text-success mb-4 rounded-md p-3 text-sm">
              Password reset email sent.
            </p>
          )}
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              {errorMessages[error] ?? errorMessages.unknown}
            </p>
          )}
          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/reset" className="text-muted-foreground hover:underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="hover:underline">
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
