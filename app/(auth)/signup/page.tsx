import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  email_taken: "That email is already in use.",
  invalid_input: "Check the form fields below.",
  weak_password: "Password is too weak — try at least 8 characters.",
  rate_limited: "Slow down — try again in a minute.",
  unknown: "Something went wrong. Try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-svh max-w-md items-center justify-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              {errorMessages[error] ?? errorMessages.unknown}
            </p>
          )}
          <form action={signUpAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" required maxLength={60} />
            </div>
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Already have one?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
