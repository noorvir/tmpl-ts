import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { SubmitButton } from "~/_components/submit-button";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/sign-in")({
  validateSearch: z.object({
    mode: z.enum(["sign-in", "sign-up"]).catch("sign-in"),
  }),
  head: () => ({ meta: [{ title: "Sign in" }] }),
  component: SignIn,
});

async function submitCredentials(args: {
  mode: "sign-in" | "sign-up";
  form: FormData;
}) {
  const { mode, form } = args;

  let path = "/api/auth/sign-in/email";
  if (mode === "sign-up") {
    path = "/api/auth/sign-up/email";
  }

  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(form)),
  });

  if (!response.ok) {
    const body: { message?: string } = await response.json();
    throw new Error(body.message ?? "Could not sign in");
  }
}

function SignIn() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const submitM = useMutation({
    mutationFn: (form: FormData) => submitCredentials({ mode, form }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.auth.getSession.queryKey(),
      });
      await navigate({ to: "/" });
    },
  });

  const isSignUp = mode === "sign-up";
  let label = "Sign in";
  let otherLabel = "Create an account";
  if (isSignUp) {
    label = "Create account";
    otherLabel = "Use an existing account";
  }

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16">
      <h1 className="text-3xl font-bold">{label}</h1>
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submitM.mutate(new FormData(event.currentTarget));
        }}
      >
        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="ada@example.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
        </div>
        <p aria-live="polite" className="text-destructive text-sm">
          {submitM.error?.message}
        </p>
        <SubmitButton label={label} isPending={submitM.isPending} />
      </form>
      <Link
        to="/sign-in"
        search={{ mode: isSignUp ? "sign-in" : "sign-up" }}
        className="text-primary underline-offset-4 hover:underline"
      >
        {otherLabel}
      </Link>
    </main>
  );
}
