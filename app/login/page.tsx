"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pulpAuthService } from "@/services/pulp/auth-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    let active = true;

    async function check() {
      const sessionUser = await pulpAuthService.getSessionUser();
      if (active && sessionUser) {
        router.replace(nextPath);
      }
    }

    void check();

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await pulpAuthService.login(username, password);
    if (!result.ok) {
      setError(result.detail);
      setIsLoading(false);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <main className="min-h-screen w-full bg-zinc-100/70 p-4 dark:bg-zinc-950 md:p-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <Card className="w-full">
          <CardTitle className="mb-4">Pulp Login</CardTitle>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <FormField label="Username">
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </FormField>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {error ? (
              <section className="mt-4 rounded-md border border-red-400 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
